"use strict"

const five = require('johnny-five')
const Tessel = require('tessel-io')

const MAX_SPEED = 255
const MOTORS = {
  left: {
    name: 'left',
    j5Motor: null,
    velocity: 0
  },
  right: {
    name: 'right',
    j5Motor: null,
    velocity: 0
  }
}

let reverseMotors = false
let trimPercent = 0

module.exports = function(leftMotor, rightMotor, useReversedMotorInputs) {
  MOTORS.left.j5Motor = leftMotor
  MOTORS.right.j5Motor = rightMotor
  reverseMotors = !!useReversedMotorInputs

  return {
    moveForward: moveForward,
    moveBackward: moveBackward,
    spinLeft: spinLeft,
    spinRight: spinRight,
    backSpinLeft: backSpinLeft,
    backSpinRight: backSpinRight,
    turnLeft: turnLeft,
    turnRight: turnRight,
    curveLeft: curveLeft,
    curveRight: curveRight,
    stop: stop,
    move: move,
    setReversal: setReversal,
    leftMotor,
    rightMotor
  }

  function setReversal (reverse) {
    reverseMotors = reverse
  }

  function moveForward (magnitude) {
    console.log('drive: moveForward')
    magnitude = defaultOrVerifyMagnitude(magnitude)
    move(magnitude, magnitude)
  }

  function moveBackward (magnitude) {
    console.log('drive: moveBackward')
    magnitude = defaultOrVerifyMagnitude(magnitude)
    move(-magnitude, -magnitude)
  }

  function turnLeft (magnitude) {
    console.log('drive: turnleft')
    magnitude = defaultOrVerifyMagnitude(magnitude)
    // move(0, magnitude)
    move(-magnitude, 0)
  }

  function turnRight (magnitude) {
    console.log('drive: turnRight')
    magnitude = defaultOrVerifyMagnitude(magnitude)
    // move(magnitude, 0)
    move(0, -magnitude)
  }

  function curveLeft (magnitude, curveFactor) {
    console.log('drive: curveLeft')
    magnitude = defaultOrVerifyMagnitude(magnitude)
    curveFactor = defaultOrVerifyCurveFactor(curveFactor)
    move(magnitude * (1 - curveFactor), magnitude)
  }

  function curveRight (magnitude, curveFactor) {
    console.log('drive: curveRight')
    magnitude = defaultOrVerifyMagnitude(magnitude)
    curveFactor = defaultOrVerifyCurveFactor(curveFactor)
    move(magnitude, magnitude * (1 - curveFactor))
  }

  function spinLeft (magnitude) {
    console.log('drive: spinLeft')
    magnitude = defaultOrVerifyMagnitude(magnitude)
    move(-magnitude, magnitude * .75)
  }

  function spinRight (magnitude) {
    console.log('drive: spinRight')
    magnitude = defaultOrVerifyMagnitude(magnitude)
    move(magnitude * .75, -magnitude)
  }

  function backSpinLeft (magnitude) {
    console.log('drive: backSpinLeft')
    magnitude = defaultOrVerifyMagnitude(magnitude)
    move (-magnitude, 0)
  }

  function backSpinRight (magnitude) {
    console.log('drive: backSpinRight')
    magnitude = defaultOrVerifyMagnitude(magnitude)
    move (0, -magnitude)
  }

  function defaultOrVerifyMagnitude (magnitude) {
    return defaultOrVerifyValueIsBetweenZeroAndOne(magnitude, 'magnitude')
  }

  function defaultOrVerifyCurveFactor (curveFactor) {
    return defaultOrVerifyValueIsBetweenZeroAndOne(curveFactor, 'curve factor')
  }

  function defaultOrVerifyValueIsBetweenZeroAndOne (value, valueName) {
    if (value === undefined) {
      return 1
    }
    if (value > 1 || value < 0) {
      throw new Error(`Specified ${valueName} out of range. Must be a float between 0 and 1, inclusive`)
    }
    return value
  }

  function stop () {
    console.log('drive: stop')
    move (0, 0)
  }

  function move (leftMotorV, rightMotorV) {
    checkAndAlertMinimumSpeedMotors(leftMotorV, rightMotorV)
    goMotor(MOTORS.left, leftMotorV)
    goMotor(MOTORS.right, rightMotorV)
  }

  function checkAndAlertMinimumSpeedMotors (leftMotorV, rightMotorV) {
    checkAndAlertMinimumSpeedMotor(leftMotorV, 'left')
    checkAndAlertMinimumSpeedMotor(rightMotorV, 'right')
  }

  function checkAndAlertMinimumSpeedMotor (motorV, motorName) {
    if (Math.abs(motorV) < 0.12 && motorV !== 0) {
      // console.warn(`${motorName} motor speed is < 0.12; motor will not turn below 12% speed!`)
    }
  }

  function goMotor (mData, velocity) {
    if (reverseMotors) {
      velocity = -velocity
    }
    if (mData.name === 'right') {
      velocity *= 1.05
    }
    const byteMagnitude = Math.abs(getVelocityAsSignedByte(velocity))

    if (velocity === 0) {
      mData.j5Motor.stop()
    } else if (velocity > 0) {
      if (mData.velocity < 0) {
        mData.j5Motor.stop().forward(byteMagnitude)
      } else {
        mData.j5Motor.forward(byteMagnitude)
      }
    } else if (velocity < 0) {
      if (mData.velocity > 0) {
        mData.j5Motor.stop().reverse(byteMagnitude)
      } else {
        mData.j5Motor.reverse(byteMagnitude)
      }
    }
    mData.velocity = velocity
  }

  function getVelocityAsSignedByte (velocityPercentage) {
    if (velocityPercentage === undefined) {
      return 0
    }
    if (velocityPercentage > 1 || velocityPercentage < -1) {
      throw new Error('Velocity percentage out of range. Must be float between 0 and 1, inclusive.')
    }
    return Math.round(velocityPercentage * MAX_SPEED)
  }
}
