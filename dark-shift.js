"use strict"

var five = require('johnny-five')
var Tessel = require('tessel-io')
var board = new five.Board({
  io: new Tessel()
})

board.on('ready', () => {
  const lightSensor = new five.Light('a7')
  const ledLumen = new five.Led('b5')
  const ledSignal = new five.Led('b6')
  let calibrating = true
  let whiteMin = 1023
  ledLumen.on()

  setTimeout(function () {
    calibrating = false
    console.log('Calibration complete!')
  }, 5000)

  lightSensor.on('change', () => {
    if (calibrating) {
      if (lightSensor.value < whiteMin) {
        whiteMin = lightSensor.value
      }
      return
    }
    lightSensor.value < whiteMin ? ledSignal.on() : ledSignal.off()
  })
})

