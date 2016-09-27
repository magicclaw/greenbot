"use strict"

const five = require('johnny-five')
const Tessel = require('tessel-io')
const board = new five.Board({
  io: new Tessel()
})
const driveModule = require('./lib/drive')
let drive = null

board.on('ready', function () {
  drive = driveModule(new five.Motor(['b5', 'b4', 'b3']), new five.Motor(['a5', 'a4', 'a3']), true)
  var photo1 = new five.Light('b1')
  var photo2 = new five.Light('b2')

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

  // photo1.on('change', () => console.log('photo1: ', photo1.level))
  // photo2.on('change', () => console.log('photo2: ', photo2.level))

  // let proximity = new five.Proximity({
  //   controller: 'HCSR04',
  //   pin: 'a2'
  // })
  // proximity.on('data', function() {
  //   console.log('Proximity: ')
  //   console.log('  cm  : ', this.cm)
  //   console.log('  in  : ', this.in)
  //   console.log('-----------------')
  // })
  // proximity.on('change', function() {
  //   console.log('The obstruction has moved.')
  // })

  console.log('ready')
  var proximity = new five.Proximity({
    controller: 'HCSR04',
    pin: 'a2'
  })
  proximity.on("data", function () {
    console.log("inches: ", this.inches)
    console.log("cm: ", this.cm)
  })
})
