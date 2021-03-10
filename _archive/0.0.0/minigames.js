// module template from moment.js

(function (global, factory) {
  let define
  typeof exports === 'object' && typeof module !== 'undefined'
    ? module.exports = factory()
    : typeof define === 'function' && define.amd
      ? define(factory)
      : global.minigames = factory()
}(this, function () { // ----------------------------

  var instanceCount = 0 // to allow multiple instances

  var defaultOptions = { // default options
    width: "400px",
    gameHeight: "300px",
    fontFamily: "sans-serif",
    frontColor: "#222222",
    backColor: 0,
    showBorder: false,
    terminalHeight: "150px",
    terminalMaxLines: 30,
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

  // ui :
  function setupUi (id, target, events, options) {
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

  function newGame (target, options) {
    options = processOptions(options, defaultOptions)
    if (!target || !target.appendChild) {
      throw new Error("minigames: no valid target, could not create ui")
    }

    instanceCount += 1 // will be used as game ID
    var id = "" + instanceCount // convert numbers to string


    var events = getEventHandler(id, options)
    var ui = setupUi(id, target, events, options)

    return {
      id,
      ui,
      events,
      id
    }
  }

  return {
    new: newGame,
    processOptions
  }
}))
