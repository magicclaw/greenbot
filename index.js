'use strict'

const five = require('johnny-five')
const Tessel = require('tessel-io')
const board = new five.Board({
  io: new Tessel()
})
const driveModule = require('./lib/drive')

board.on('ready', function () {
  const drive = driveModule(new five.Motor(['b5', 'b4', 'b3']), new five.Motor(['a5', 'a4', 'a3']), true)
  const rightLight = new five.Light('b1')
  const leftLight = new five.Light('b2')
  const toggle = new five.Switch('a6')
  const finishLineLight = new five.Light('a7')
  const finishLED = new five.Led('b7')

  this.repl.inject({
    drive: drive,
    toggle: toggle
  })

  const TURN_SPEED = 0.35
  const FORWARD_SPEED = 0.22 // .2 is the minimum; .26 seems to work well; .3 seems to be an upper limit on this to detect the line in time to change directions
  const LIGHT_THRESHOLD = 0.9
  const TURN_MINIMUM_MS = 100
  const STARTUP_WAIT_TIME = 500

  let courseLeft
  let courseRight
  let isLineFollow // = toggle.isClosed
  let finishDetected = false
//  let finishDetectionBaseline = 1

  toggle.on('close', function () {
    console.log('Not the line follow course')
    finishDetected = false
    isLineFollow = false
  })

  toggle.on('open', function () {
    console.log('Line Follow Course')
    finishDetected = false
    isLineFollow = true
  })

  finishLineLight.on('change', function () {
    console.log(finishLineLight.level)
    // finishDetected = finishLineLight.level >= (finishDetectionBaseline + 0.04)
    finishDetected = finishLineLight.level >= 0.93
  })

  this.on('message', function (event) {
  /*
    Event {
      type: "info"|"warn"|"fail",
      timestamp: Time of event in milliseconds,
      class: name of relevant component class,
      message: message [+ ...detail]
    }
  */
    console.log('Received a %s message, from %s, reporting: %s', event.type, event.class, event.message)
  })

  this.loop(50, mainLoop)

  const STATE = {
    pause: {
      name: 'pause',
      getNextState: function (leftHit, rightHit) {
        if (this.pauseDone) {
          this.pauseDone = false
          return STATE.stop
        }
        if (!this.pausing) {
          this.pausing = true
          board.wait(STARTUP_WAIT_TIME, () => {
            //finishDetectionBaseline = finishLineLight.level
            this.pausing = false
            this.pauseDone = true
          })
        }
      },
      go: () => drive.stop()
    },
    left: {
      name: 'left',
      getNextState: function (leftHit, rightHit) {
        if (isLineFollow && leftHit && rightHit) {
          return STATE.acuteEscape
        }
        if (rightHit) {
          this.leftTurnDone = false
          this.turningLeft = false
          return courseRight
        }
        if (!leftHit) {
          if (this.leftTurnDone) {
            this.leftTurnDone = false
            return STATE.forward
          }
          if (!this.turningLeft) {
            this.turningLeft = true
            board.wait(TURN_MINIMUM_MS, () => {
              this.turningLeft = false
              this.leftTurnDone = true
            })
          }
        }
      },
      go: () => drive.spinLeft(TURN_SPEED)
    },
    right: {
      name: 'right',
      getNextState: function (leftHit, rightHit) {
        if (isLineFollow && leftHit && rightHit) {
          return STATE.acuteEscape
        }
        if (leftHit) {
          this.rightTurnDone = false
          this.turningRight = false
          return courseLeft
        }
        if (!rightHit) {
          if (this.rightTurnDone) {
            this.rightTurnDone = false
            return STATE.forward
          }
          if (!this.turningRight) {
            this.turningRight = true
            board.wait(TURN_MINIMUM_MS, () => {
              this.turningRight = false
              this.rightTurnDone = true
            })
          }
        }
      },
      go: () => drive.spinRight(TURN_SPEED)
    },
    forward: {
      name: 'forward',
      getNextState: function (leftHit, rightHit) {
        if (isLineFollow && leftHit && rightHit) {
          return STATE.acuteEscape
        }
        if (leftHit) {
          return courseLeft
        }
        if (rightHit) {
          return courseRight
        }
      },
      go: () => drive.moveForward(FORWARD_SPEED)
    },
    backward: {
      name: 'backward',
      getNextState: function (leftHit, rightHit) {
        if (isLineFollow && leftHit && rightHit) {
          return STATE.acuteEscape
        }
        if (!leftHit && !rightHit) {
          return STATE.stop
        }
      },
      go: () => drive.moveBackward(FORWARD_SPEED)
    },
    acuteEscapeBackward: {
      name: 'acuteEscapeBackward',
      getNextState: function (leftHit, rightHit) {
        // first one to clear is the acute escape angle
        if (leftHit && !rightHit) {
          return STATE.acuteEscapeRight
        }
        if (rightHit && !leftHit) {
          return STATE.acuteEscapeLeft
        }
      },
      go: () => drive.moveBackward(FORWARD_SPEED)
    },
    acuteEscapeLeft: {
      name: 'acuteEscapeLeft',
      getNextState: function (leftHit, rightHit) {
        if (leftHit) {
          return STATE.left
        }
      },
      go: () => drive.turnLeft(TURN_SPEED)
    },
    acuteEscapeRight: {
      name: 'acuteEscapeRight',
      getNextState: function (leftHit, rightHit) {
        if (rightHit) {
          return STATE.right
        }
      },
      go: () => drive.turnRight(TURN_SPEED)
    },
    acuteEscape: {
      name: 'acuteEscape',
      getNextState: function (leftHit, rightHit) {
        // back up until one of the sensors clears
        // return STATE.left
        return STATE.stop
      },
      go: () => drive.stop()
    },
    stop: {
      name: 'stop',
      getNextState: function (leftHit, rightHit) {
        if (isLineFollow && leftHit && rightHit) {
          return STATE.acuteEscape
        }
        if (!leftHit && !rightHit) {
          return STATE.forward
        }
      },
      go: () => drive.stop()
    },
    halt: {
      name: 'halt',
      getNextState: function (leftHit, rightHit) {},
      go: () => drive.stop()
    }
  }

  let newState = null
  let state = STATE.pause


  state.go()
  function mainLoop () {
    courseLeft = isLineFollow ? STATE.left : STATE.right
    courseRight = isLineFollow ? STATE.right : STATE.left
    const leftHit = leftLight.level >= LIGHT_THRESHOLD
    const rightHit = rightLight.level >= LIGHT_THRESHOLD
    // console.log(`leftLight(${leftLight.level}), rightLight(${rightLight.level})`)
    if (finishDetected) {
      console.log('should be stopping')
      drive.stop()
      finishLED.on()
      return
    } else if (!finishDetected) {
      finishLED.off()
    }

    newState = state.getNextState(leftHit, rightHit)
    if (newState) {
      // console.log(`leftHit(${leftHit}), rightHit(${rightHit})`)
      // console.log(state.name + ' --> ' + newState.name)
      state = newState
      state.go(leftHit, rightHit)
    }
  }
})
