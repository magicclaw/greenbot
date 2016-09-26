
var Tessel = require('tessel-io')
var five = require('johnny-five')

var board = new five.Board({
  io: new Tessel()
})

board.on('ready', () => {
  var led = new five.Led('b6')
  led.pulse(500)
})

