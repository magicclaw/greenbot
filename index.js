"use strict"

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

  this.repl.inject({
    drive: drive
  })

  const TURN_SPEED = 0.35
  const FORWARD_SPEED = .20 // .2 is the minimum; .26 seems to work well; .3 seems to be an upper limit on this to detect the line in time to change directions
  const LIGHT_THRESHOLD = .9
  const TURN_MINIMUM_MS = 200
  const STARTUP_WAIT_TIME = 500

  this.loop(1, mainLoop)

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
        if (rightHit) {
          this.leftTurnDone = false
          this.turningLeft = false
          return STATE.right
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
        if (leftHit && rightHit)
        if (leftHit) {
          this.rightTurnDone = false
          this.turningRight = false
          return STATE.left
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
        if (leftHit) {
          return STATE.left
        }
        if (rightHit) {
          return STATE.right
        }
      },
      go: () => drive.moveForward(FORWARD_SPEED)
    },
    backward: {
      name: 'backward',
      getNextState: function (leftHit, rightHit) {
        if (!leftHit && !rightHit) {
          return STATE.stop
        }
      },
      go: () => drive.moveBackward(FORWARD_SPEED)
    },
    stop: {
      name: 'stop',
      getNextState: function (leftHit, rightHit) {
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
    const leftHit = leftLight.level >= LIGHT_THRESHOLD
    const rightHit = rightLight.level >= LIGHT_THRESHOLD

    // The following is nice to have the thing stop when you pick it up...however,
    // this causes the car to die at the acute angle corner. We need to make the
    // car spin if it encounters leftHit && rightHit until it gets itself free...
    // More work to figure this out is needed...
    const leftAndRightMaxed = leftLight.level === 1 && rightLight.level === 1

    newState = leftAndRightMaxed ? STATE.stop : state.getNextState(leftHit, rightHit)
    if (newState) {
      // console.log(`leftHit(${leftHit}), rightHit(${rightHit})`)
      // console.log(`leftLight(${leftLight.level}), rightLight(${rightLight.level})`)
      console.log(state.name + ' --> ' + newState.name)
      state = newState
      state.go()
    }
  }
})
