"use strict"

const five = require('johnny-five')
const Tessel = require('tessel-io')
const board = new five.Board({
  io: new Tessel()
})
const driveModule = require('./lib/drive')
let drive = null

board.on("ready", function () {
  drive = driveModule(new five.Motor(['b5','b4','b3']), new five.Motor(['a5','a4','a3']), true)

  this.repl.inject({
    drive: drive
  })

  drive.moveForward(0.25)
  board.wait(1000, function () {
    drive.moveBackward(0.25)
    board.wait(1000, function () {
      drive.stop()
    })
  })
})
