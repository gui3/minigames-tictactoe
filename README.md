# minigames : tic tac toe

> A full-javascript-old-browser-compatible **tic tac toe** game,
> with a **AI bot** you can play against.

## use

This repository was made for fun and to develop my best practices.
The main goals were :

- to be as compatible as possible with **old browsers**n=,
  by using only `for` loops and `var` declarations
- to only use javascript, and **not a html element** 
  that would be  prepared.
  This ensures the thing is portable as possible.

### to play

If you have time to kill,
try to beat the AI on this
[github page](https://gui3.github.io/minigames-tictactoe/)

### to put the game on you web page

If you really want a tic tac toe
for your users to wait wile you **process their big data**,
you can embed this game in 3 easy steps :

1- put the 2 scripts files `minigames.js` and `tictactoe.js`
in a static folder available to the page

2- choose a place where to put the game,
and make sure you can access it easily (with an id is ideal):
```html
<div id="tictactoe"></div>
```

3- import the 2 scripts by adding these tags,
and add the game setup as follow,
preferably at the bottom of your page.

```html
<script src="./minigames.js"></script>
<script src="./tictactoe.js"></script>
<script>
const game = tictactoe.new(
  minigames, // this is compulsory
  document.getElementById("tictactoe"), // your target DOM element
  {
    // optional argument with different customization options
  }
)
</script>
```