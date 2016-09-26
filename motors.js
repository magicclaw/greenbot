"use strict"

const five = require('johnny-five')
const Tessel = require('tessel-io')
const board = new five.Board({
  io: new Tessel()
})
const motors = [
  {
    motor: null,
    velocity: 0
  },
  {
    motor: null,
    velocity: 0
  }
]
const MAX_SPEED = 255

board.on("ready", () => {
  // MOTOR 0 == LEFT

  motors[0].motor = new five.Motor(['a5','a4','a3'])
  motors[1].motor = new five.Motor(['b5','b4','b3'])

  spinLeft(1)
  board.wait(5000, () => {
    spinRight(1)
    board.wait(5000, () => {
      vroom(0.75, 1)
      board.wait(5000, () => {
        vroom(-1, -0.75)
        board.wait(5000, () => {
          allStop()
        })
      })
    })
  })
})

function allStop () {
  vroom(0, 0)
}

function spinLeft (speed) {
  vroom(speed, -speed)
}

function spinRight (speed) {
  vroom(-speed, speed)
}

function vroom (m1Velocity, m2Velocity) {
  goMotor(0, m1Velocity)
  goMotor(1, m2Velocity)
}

function goMotor (motorIndex, velocity) {
  velocity = -velocity
  const mData = motors[motorIndex]
  velocity = Math.round(velocity * MAX_SPEED)
  if (velocity === 0) {
    mData.motor.stop()
    mData.velocity = 0
    return
  }
  if (velocity > 0) {
    if (mData.velocity < 0) {
      goMotor(motorIndex, 0)
    }
    mData.motor.forward(velocity)
    mData.velocity = velocity
    return
  }
  if (velocity < 0) {
    if (mData.velocity > 0) {
      goMotor(motorIndex, 0)
    }
    mData.motor.reverse(Math.abs(velocity))
    mData.velocity = velocity
    return
  }
}
