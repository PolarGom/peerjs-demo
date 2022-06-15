<template>
  <div id="layout_paint" ref="layoutPaint">
    <canvas
      id="canvas"
      @mousedown="onDrawReady"
      @mousemove="onDrawing"
      @mouseup="onDrawStop"
      @mouseout="onDrawStop"></canvas>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  props: {
    id: {
      type: String,
      required: true,
      default: ''
    },
    roomId: {
      type: String,
      required: true,
      default: ''
    }
  },
  data() {
    return {
      canvas: null,
      canvasContext: null,
      drawing: {
        isStart: false,
        offsetX: 0,
        offsetY: 0
      },
      pen: {
        type: 'pen', // pen, eraser
        color: '#FF0000',
        lineWidth: 10,
        lineCap: 'round' // round, butt, square
      }
    }
  },
  computed: {
    ...mapGetters([
      'isOwner'
    ])
  },
  created() {
  },
  mounted() {
    this.init()
    this.initCanvas()
    // window.addEventListener('resize', this.onViewResize)
  },
  unmounted() {
    this.unMounted()
  },
  methods: {
    init() {
      this.$EventBus.on('paintReceive', this.onReceivePaint)
    },
    onReceivePaint(receiveData) {
      const isStart = receiveData.data.isStart

      if (isStart === undefined) {
        // 그리는 중
        if (receiveData.data.func === 'draw') {
          this.onDrawing({
            offsetX: this.canvas.width * receiveData.data.xp,
            offsetY:this.canvas.height * receiveData.data.yp,
            receive: true
          })
        } else if (receiveData.data.func === 'AllClear') {
          this.onExecuteFunc(receiveData.data.func)
        }
      } else {
        if (isStart) {
          this.pen.type = receiveData.data.penType
          this.pen.color = receiveData.data.color
          this.pen.lineWidth = receiveData.data.lineWidth
          this.pen.lineCap = receiveData.data.lineCap
          this.onDrawReady({
            offsetX: this.canvas.width * receiveData.data.xp,
            offsetY:this.canvas.height * receiveData.data.yp,
            receive: true
          })
        } else {
          this.onDrawStop()
        }
      }
    },
    unMounted() {
      this.$EventBus.off('paintReceive')
      // window.removeEventListener('resize', this.onViewResize)
    },
    initCanvas() {
      this.canvas = document.getElementById('canvas')
      this.canvasContext = this.canvas.getContext('2d')
      this.onUpdateCanvasSize()
    },
    getPaintXY(event) {
      let x = null
      let y = null

      if (this.isOwner || event.receive !== undefined) {
        x = event.offsetX
        y = event.offsetY
      }

      return {
        x: x,
        y: y,
        isDrawPossible: x !== null && y !== null
      }
    },
    onDrawReady(event) {
      const { x, y, isDrawPossible } = this.getPaintXY(event)

      console.log(x, y, isDrawPossible)

      if (!isDrawPossible) {
        return
      }

      this.canvasContext.lineCap = this.pen.lineCap
      this.canvasContext.lineWidth = this.pen.lineWidth
      this.canvasContext.strokeStyle = this.pen.color
      this.canvasContext.globalCompositeOperation = 'source-over'

      if (this.pen.type === 'eraser') {
        this.canvasContext.globalCompositeOperation = 'destination-out'
      }

      this.drawing.isStart = true
      this.drawing.offsetX = x
      this.drawing.offsetY = y

      this.sendSocket({
        func: 'draw',
        isStart: true,
        penType: this.pen.type,
        lineCap: this.pen.lineCap,
        lineWidth: this.pen.lineWidth,
        color: this.pen.color,
        x: this.drawing.offsetX,
        y: this.drawing.offsetY,
        xp: this.drawing.offsetX / this.canvas.width,
        yp: this.drawing.offsetY / this.canvas.height
      })
    },
    onDrawing(event) {
      const { x, y, isDrawPossible } = this.getPaintXY(event)

      if (!isDrawPossible) {
        return
      }

      if (this.drawing.isStart) {
        const newX = x
        const newY = y

        this.canvasContext.beginPath()
        this.canvasContext.moveTo(this.drawing.offsetX, this.drawing.offsetY)
        this.canvasContext.lineTo( newX, newY )
        this.canvasContext.stroke()

        this.drawing.offsetX = newX
        this.drawing.offsetY = newY

        this.sendSocket({
          func: 'draw',
          x: newX,
          y: newY,
          xp: newX / this.canvas.width,
          yp: newY / this.canvas.height
        })
      }
    },
    onDrawStop() {
      if (!this.isOwner) {
        return
      }

      this.drawing.isStart = false
      this.sendSocket({ func: 'draw', isStart: false })
    },
    onViewResize() {
      this.onUpdateCanvasSize()
    },
    onUpdateCanvasSize() {
      this.$nextTick(() => {
        this.canvas.width = window.innerWidth - document.getElementById('layout_chat').clientWidth - document.getElementById('layout_cam').clientWidth
        this.canvas.height = window.innerHeight - document.getElementById('layout_top').clientHeight
      })
    },
    onChangePen(pen) {
      if (!this.isOwner) {
        return
      }

      if (pen.type === 'paint') {
        this.onExecuteFunc(pen.func)
      } else if (pen.type === 'pen') {
        this.pen.type = pen.pen
      } else if (pen.type === 'color') {
        this.pen.type = pen.pen
        this.pen.color = pen.color
      }
    },
    onExecuteFunc(func) {
      const funcName = `on${func}`

      if (!this[funcName]) {
        alert(`${funcName}은(는) 존재하지 않는 기능입니다.`)
      } else {
        this[funcName]()
      }
    },
    onAllClear() {
      this.sendSocket({ func: 'AllClear' })
      this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height)
    },
    /**
     * 상대방에게 나의 페인트 정보 전송
     *
     * @method sendSocket
     * @param {Object} data 전송 할 데이터
     */
    sendSocket(data) {
      let request = {}
      request.msgType = 'paint'
      request.data = data

      this.$EventBus.emit('paint', request)
    }
  }
}
</script>

<style scoped>
#layout_paint {
  width: 100%;
  height: 100%;
}

#canvas {
  border: 1px solid;
}
</style>
