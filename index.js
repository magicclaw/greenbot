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
  var leftLight = new five.Light('b1')
  var rightLight = new five.Light('b2')

  this.repl.inject({
    drive: drive
  })

  const driveSpeed = .22

  // drive.moveForward(0.25)
  // board.wait(1000, function () {
  //   drive.moveBackward(0.25)
  //   board.wait(1000, function () {
  //     drive.stop()
  //   })
  // })

  // leftLight.on('change', () => console.log('photo1: ', leftLight.level))
  // rightLight.on('change', () => console.log('photo2: ', rightLight.level))

  // function respondToLightChange(level, sensor) {
  //   // sensor = "left" / "right"
  //   console.log(`sensor: ${sensor}, reading: ${level}`)
  // }

  this.loop(5, pollForLightChanges)
  // pollForLightChanges()

  // drive.moveForward()

  // drive.rightMotor.reverse(128)

  // drive.leftMotor.reverse(128)


  let prevState = ''
  let currentState = 'stop'
  function pollForLightChanges () {
    // setInterval(function () {
      const leftLvl = leftLight.level
      const rightLvl = rightLight.level

      // console.log(`left light: ${leftLvl}, right light: ${rightLvl}`)

      if (leftLvl >= .97 ) {
        // console.log('detected line on left sensor')
        // drive.stop()
        // drive.spinLeft(0.25)
        // drive.leftMotor.reverse(128)
        // drive.rightMotor.forward(128)
        // drive.spinRight(.45)
        drive.stop()
        currentState = 'right'
      } else if (rightLvl >= .97) {
        // console.log('detected line on right sensor')
        // drive.leftMotor.forward(128)
        // drive.rightMotor.reverse(128)
        // drive.spinLeft(.45)
        drive.stop()
        currentState = 'left'
      } else {
        // console.log('centered on line, moving forward')
        // drive.leftMotor.reverse(128)
        // drive.rightMotor.reverse(128)
        drive.moveForward(.25)
        currentState = 'forward'
      }

      if (prevState !== currentState) {
        console.log(`${prevState} => ${currentState}`)
        prevState = currentState
      }
    // }, 300)
  }
})
