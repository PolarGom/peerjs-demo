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
  created() {
  },
  mounted() {
    this.initCanvas()
    // window.addEventListener('resize', this.onViewResize)
  },
  unmounted() {
    // window.removeEventListener('resize', this.onViewResize)
  },
  methods: {
    initCanvas() {
      this.canvas = document.getElementById('canvas')
      this.canvasContext = this.canvas.getContext('2d')
      this.onUpdateCanvasSize()
    },
    onDrawReady(event) {
      this.canvasContext.lineCap = this.pen.lineCap
      this.canvasContext.lineWidth = this.pen.lineWidth
      this.canvasContext.strokeStyle = this.pen.color
      this.canvasContext.globalCompositeOperation = 'source-over'

      if (this.pen.type === 'eraser') {
        this.canvasContext.globalCompositeOperation = 'destination-out'
      }

      this.drawing.isStart = true
      this.drawing.offsetX = event.offsetX
      this.drawing.offsetY = event.offsetY

      this.onSendSocket({
        func: 'draw',
        isStart: true,
        lineCap: this.pen.lineCap,
        lineWidth: this.pen.lineWidth,
        color: this.pen.color,
        x: this.drawing.offsetX,
        y: this.drawing.offsetY
      })
    },
    onDrawing(event) {
      if (this.drawing.isStart) {
        const newX = event.offsetX
        const newY = event.offsetY

        this.canvasContext.beginPath()
        this.canvasContext.moveTo(this.drawing.offsetX, this.drawing.offsetY)
        this.canvasContext.lineTo( newX, newY )
        this.canvasContext.stroke()

        this.drawing.offsetX = newX
        this.drawing.offsetY = newY

        this.onSendSocket({ func: 'draw', x: newX, y: newY })
      }
    },
    onDrawStop() {
      this.drawing.isStart = false
      this.onSendSocket({ func: 'draw', isStart: false })
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
      this.onSendPaintInfo({ func: 'allClear' })
      this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height)
    },
    /**
     * 상대방에게 나의 페인트 정보 전송
     *
     * @method onSendPaintInfo
     * @param {Object} data 전송 할 데이터
     */
    onSendSocket(data) {
      let request = {}
      request.msgType = 'paint'
      request.data = data
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
