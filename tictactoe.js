// module template from moment.js

(function (global, factory) {
  let define
  typeof exports === 'object' && typeof module !== 'undefined'
    ? module.exports = factory()
    : typeof define === 'function' && define.amd
      ? define(factory)
      : global.tictactoe = factory()
}(this, function () { // ----------------------------

  var instanceCount = 0 // to allow multiple instances

  var defaultOptions = { // default options
    sideSize: 3,
    cellWidth: "100px",
    cellHeight: "80px",
    fontSize: "2.5em",
    symbolEmpty: " ",
    symbolPlayer1: "O",
    symbolPlayer2: "X",
    botGoFirst: true,
    randomTurn: true,
    winColor: "#d00",

    // minigames options :
    width: "400px",
    gameHeight: "300px",
    fontFamily: "sans-serif",
    frontColor: "#555555",
    backColor: "#ffffff",
    showBorder: false,
    terminalHeight: "150px",
    terminalMaxLines: 100,
    showTerminal: true,
    messagePrefix: ">> "
  }

  // processing options :
  function processOptions (options = {}, defaultOptions = {}) {

    var defaultKeys = Object.keys(defaultOptions)
    for (var i = 0; i < defaultKeys.length; i++) {
      var key = defaultKeys[i]
      var option = options[key]
      options[key] = option === undefined ? defaultOptions[key] : option
    }

    if (!options.document || !options.document.createElement) {
      if (document && document.createElement) {
        options.document = document
      }
      else if (window && window.createElement) {
        options.document = window
      }
      else {
        throw new Error(
          "minigames: no valid document object, could not create ui"
        )
      }
    }
    return options
  }

  // events :
  var eventRegistry = []

  function sendEvent (id, eventName, args) {
    var eventCount = eventRegistry.length
    for (var i = 0; i < eventCount; i++) {
      var currentEvent = eventRegistry[i]
      if (currentEvent.id === id 
      && currentEvent.eventName === eventName) {
        currentEvent.action(args)
      }
    }
  }
  function addEvent (id, eventName, action) {
    eventRegistry.push({
      id,
      eventName,
      action
    })
  }
  function clearEvent (id, eventName) {
    var eventCount = eventRegistry.length
    var newRegistry = []
    for (var i = 0; i < eventCount; i++) {
      var currentEvent = eventRegistry[i]
      if (currentEvent.id !== id
      || currentEvent.eventName !== eventName) {
        newRegistry.push(currentEvent)
      }
    }
    eventRegistry = newRegistry
  }

  function getEventHandler (id, options) {
    function send (eventName, args) {
      sendEvent(id, eventName, args)
    }
    function on (eventName, action) {
      addEvent(id, eventName, action)
    }
    function clear(eventName) {
      clearEvent(id, eventName)
    }

    return {
      send,
      on,
      clear
    }
  }

  // base ui :
  function setupBaseUi (id, target, events, options) {
    var container = options.document.createElement("div")
    container.id = "minigames:" + id
    container.classList.add("minigame")

    container.style.width = options.width
    container.style.height = options.height
    container.style.backgroundColor = options.backColor
    container.style.color = options.frontColor
    container.style.fontFamily = options.fontFamily

    if (options.showBorder) {
      container.style.borderWidth = "2px"
      container.style.borderStyle = "solid"
      container.style.borderColor = options.frontColor
    }

    // message box
    var messageBox = options.document.createElement("p")
    function message2box (text) {
      while (messageBox.firstChild) {
        messageBox.removeChild(messageBox.firstChild)
      }
      messageBox.appendChild(
        document.createTextNode(text)
      )
    }

    // game section
    var game = options.document.createElement("div")
    game.style.width = "100%"
    game.style.height = options.gameHeight


    // terminal :
    var terminal = options.document.createElement("pre")
    terminal.style.height = options.terminalHeight
    terminal.style.overflow = "auto"
    terminal.style.margin = 0
    terminal.style.borderWidth = "2px 10px"
    terminal.style.borderStyle = "solid"
    terminal.style.borderColor = options.frontColor
    function message2terminal (text) {
      var lines = terminal.childNodes
      var outOfBounds = lines.length - options.terminalMaxLines + 1
      for (var i = 0; i < outOfBounds; i++) {
        terminal.removeChild(lines[0])
      }
      terminal.appendChild(
        options.document.createTextNode(
          options.messagePrefix + text + "\n"
        )
      )
      terminal.scrollTop = terminal.scrollHeight
      if (typeof terminal.scrollTo === "function") {
        terminal.scrollTo(0, terminal.scrollHeight)
      }
    }
    events.on("message", function (text) {
      message2box(text)
      message2terminal(text)
    })

    container.appendChild(messageBox)
    container.appendChild(game)
    if (options.showTerminal) container.appendChild(terminal)
    target.appendChild(container)

    events.send("message", "interface ready")


    return {
      container,
      game,
      terminal
    }
  }


  // cells analysis
  function getAllLines (logic) {
    // scans the grid and returns an array
    // with all the possible lines
    // (rows, columns and diagonals)
    var results = []
    var diagUp = []
    var diagDown = []
    var size = logic.cells.length
    for (var y = 0; y < size; y++) {
      var row = []
      var column = []
      for (var x = 0; x < size; x++) {
        row.push(logic.cells[y][x])
        column.push(logic.cells[x][y])
      }
      diagUp.push(logic.cells[y][y])
      diagDown.push(logic.cells[y][size - 1 - y])
      results.push(row)
      results.push(column)
    }
    results.push(diagUp)
    results.push(diagDown)

    return results
  }

  // AI
  var scoreGrid = [ // interrest according to the lines schema :
    [2, 0, 20, 0],  // ..., O.., OO., OOO   (X === bot, O === Player)
    [5, 0, 0],      // ..X, .OX, OOX
    [30, 0],        // .XX, OXX
    [0]             // XXX
  ]

  function botThinksAndPlay (logic, events, options) {
    // gives a score of interest to each cell
    // according to the state of the line it is in
    // then select a random cell between those
    // who have the highest score
    var allCells = []
    var allLines = getAllLines(logic)

    var size = options.sideSize

    // get all cells references
    for (var y = 0; y < logic.cells.length; y++) {
      var line = logic.cells[y]
      for (var x = 0; x < line.length; x++) {
        var cell = line[x]
        cell.s = (
          cell.x === 0 || cell.y === size
        ) && (
          cell.y === 0 || cell.y === size
        )
          ? 5 // a big bonus for cells in corners
          : (size % 2) !== 0 
          && cell.x === (size - 1) / 2 
          && cell.y === (size - 1) / 2
            ? 2 // a small bonus for cell in the middle
            : 0 // no bonus for other cells
        allCells.push(cell)
      }
    }

    // calculate each line score
    for (var l = 0; l < allLines.length; l++) {
      var line = allLines[l]
      var countBot = 0
      var countPlayer = 0
      for (var c = 0; c < line.length; c++) {
        switch(line[c].v) {
          case 1:
            countPlayer++
            break
          case 2:
            countBot++
            break
        }
      }
      var lineScore = scoreGrid[countBot][countPlayer]

      // add score to each cell of the line
      for (var c = 0; c < line.length; c++) {
        var cell = line[c]
        if (cell.v === 0) cell.s += lineScore
      }
    }

    // find best cell to play
    var bestScore = 0
    var bestCells = []
    for (var c = 0; c < allCells.length; c++) {
      var cell = allCells[c]
      if (
        cell.v === 0
        && bestScore < cell.s
      ) {
        bestScore = cell.s
        bestCells = []
      }
      if (cell.s === bestScore && cell.v === 0) {
        bestCells.push(cell)
      }
    }

    if (bestCells.length > 0) {
      var playedCell = bestCells[
        Math.floor(Math.random() * bestCells.length)
      ]
  
      botPlays(events, [playedCell.x, playedCell.y])
    }
    else {
      events.send("message", "error: no more cells to play for bot")
    }
  }

  function botFirstRound(logic, events) {
    var coords = [
      Math.floor(Math.random() * logic.cells.length),
      Math.floor(Math.random() * logic.cells.length)
    ]
    botPlays(events, coords)
  }

  function botPlays(events, coord) {
    events.send("cellClicked", coord)
  }

  // game logic :
  function gameWon (line, logic, events) {
    events.send(
      "message",
      logic.getPlayerName(line[0].v)
      + " won the game ! click on a cell to start a new match !"
    )
    for (var c = 0; c < line.length; c++) {
      line[c].w = true
    }
    events.send("redraw")
  }

  function checkEndGame (logic, events) {
    var endgame = true
    var lines = getAllLines(logic)

    for (var l = 0; l < lines.length; l++) {
      var line = lines[l]
      var winning = true
      var lastValue = line[0].v
      if (lastValue !== 0) {
        for (var c = 0; c < line.length; c++) {
          var cell = line[c]
          if (cell.v === 0) {
            endgame = false
            winning = false
          }
          if (cell.v !== lastValue) {
            winning = false
          }
        }
        if (winning === true) {
          gameWon(line, logic, events)
          return true
        }
      }
      else {
        endgame = false
      }
    }
    if (endgame) {
      events.send("message", "Nobody won, click to start a new game")
    }
    return endgame
  }

  function setupLogic (id, events, options) {
    var gameIsOver = false
    var currentPlayer = 1
    var whoStarts = 1

    var symbols = [
      options.symbolEmpty,
      options.symbolPlayer1,
      options.symbolPlayer2
    ]
    var playerNames = [
      "nobody",
      "You",
      "the bot"
    ]

    var cells = []
    for (var y = 0; y < options.sideSize; y++) {
      var row = []
      for (var x = 0; x < options.sideSize; x++) {
        row.push({
          v: 0, // cell value
          x,    // cell coordinates
          y,
          w: false // wether the cell is in the winning line
        })
      }
      cells.push(row)
    }

    function getSymbol (id) {
      return symbols[id]
    }
    function getPlayerName (id) {
      return playerNames[id]
    }
    function getCurrentPlayer () {
      return currentPlayer
    }
    function start (player) {
      //reset(logic, events)
      whoStarts = player > 0 ? player : whoStarts === 1 ? 2 : 1
      currentPlayer = whoStarts
      events.send(
        "message",
        getPlayerName(whoStarts)
        + " will start this game"
      )

      if (currentPlayer === 2) {
        botFirstRound(logic, events)
      }
    }
    function alternatePlayer () {
      currentPlayer = currentPlayer === 1 ? 2 : 1
    }

    events.on("reset", function () {
      gameIsOver = false
      start(0)
    })

    events.on("cellClicked", function (coord) {
      if (gameIsOver) {
        reset(logic, events)
      }
      else {
        cellClicked(coord, logic, events)
      }
    })

    events.on("cellPlayed", function () {
      gameIsOver = checkEndGame(logic, events)
      if (!gameIsOver) {
        alternatePlayer()
        if (currentPlayer === 2) {
          botThinksAndPlay(logic, events, options)
        }
      }
    })

    var logic = {
      cells,
      getSymbol,
      getPlayerName,
      getCurrentPlayer,
      start,
      alternatePlayer
    }

    start(
      options.botGoFirst ? 2 : 0
    )

    return logic
  }

  function cellClicked (coord, logic, events) {
    var cells = logic.cells

    if (cells[coord[1]][coord[0]].v === 0) {
      events.send(
        "message",
        logic.getPlayerName(logic.getCurrentPlayer())
        + " played cell "
        + coord[0]
        + ":"
        + coord[1]
      )
      cells[coord[1]][coord[0]].v = logic.getCurrentPlayer()
      events.send("redraw")
      events.send("cellPlayed")
    }
    else {
      events.send(
        "message",
        "!!! "
        + logic.getPlayerName(logic.getCurrentPlayer())
        + " played occupied cell "
        + coord[0]
        + ":"
        + coord[1]
        + ", please play another."
      )
      events.send("wrongInput", coord)
    }
  }

  function reset (logic, events) {
    for (var r = 0; r < logic.cells.length; r++) {
      for (var c = 0; c < logic.cells[r].length; c++) {
        var cell = logic.cells[r][c]
        cell.v = 0
        cell.w = false
      }
    }
    events.send("redraw")
    events.send("message", "new game started")
    events.send("reset")
  }

  // ui :
  function setupUi (id, ui, logic, events, options) {
    ui.game.classList.add("tictactoe")
    ui.game.id = "minigames:tictactoe:" + id
    ui.game.style.fontSize = options.fontSize
    ui.game.style.fontWeight = "bold"

    // to prevent external css problems :
    ui.game.style.margin = "0"
    ui.game.style.padding = "0"

    function redraw () {
      while(ui.game.firstChild) {
        ui.game.removeChild(ui.game.firstChild)
      }
      
      for (var y = 0; y < logic.cells.length; y++) {
        var logicRow = logic.cells[y]
        var uiRow = options.document.createElement("div")
        for (var x = 0; x < logicRow.length; x++) {
          var cell = options.document.createElement("button")
          cell.x = x
          cell.y = y
          cell.classList.add("cell")

          cell.style.width = options.cellWidth
          cell.style.height = options.cellHeight
          cell.style.verticalAlign = "bottom"
          cell.style.font = "inherit"
          cell.style.backgroundColor = options.backColor
          cell.style.borderColor = options.frontColor
          cell.style.borderWidth = "2px"
          cell.style.color = logicRow[x].w
            ? options.winColor
            : options.frontColor

          cell.appendChild(
            options.document.createTextNode(
              logic.getSymbol(logicRow[x].v)
            )
          )
          cell.addEventListener("click", function (evt) {
            events.send("cellClicked", [evt.target.x, evt.target.y])
          })
          uiRow.appendChild(cell)
        }
        ui.game.appendChild(uiRow)
      }
    }
    redraw()

    events.on("redraw", redraw)

    return ui
  }

  function newGame (target, options) {
    options = processOptions(options, defaultOptions)
    if (!target || !target.appendChild) {
      throw new Error("minigames: no valid target, could not create ui")
    }

    instanceCount += 1 // will be used as game ID
    var id = "" + instanceCount // convert numbers to string

    var events = getEventHandler(id, options)
    var ui = setupBaseUi(id, target, events, options)

    var logic = setupLogic(id, events, options)
    var ui = setupUi(id, ui, logic, events, options)

    return {
      id,
      ui,
      logic,
      events
    }
  }

  return {
    new: newGame
  }
}))
