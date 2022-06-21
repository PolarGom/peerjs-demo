<template>
  <div id="layout_paint" ref="layoutPaint">
    <div
      id="layout_viewer"
      ref="viewer"
      :style="{ width: `${width}px`, height: `${height}px` }">
    </div>
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
  data() {
    return {
      width: 0,
      height: 0,
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
    ...mapGetters({
      isOwner: 'getIsOwner'
    })
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
      const msgType = receiveData.msgType
      const isStart = receiveData.data.isStart

      // 이미지 드로잉
      if (msgType === 'paint-img') {
        this.receiveDrawImage(receiveData.data)
        return
      }

      // Drawing
      if (isStart === undefined) {
        // 그리는 중
        if (receiveData.data.func === 'draw') {
          this.onDrawing({
            offsetX: this.canvas.width * receiveData.data.xp,
            offsetY:this.canvas.height * receiveData.data.yp,
            receive: true
          })
        } else if (receiveData.data.func === 'AllClear') {
          this.executeFunc(receiveData.data.func)
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

      this.sendSocket(
        'paint', {
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

        this.sendSocket(
          'paint', {
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
      this.sendSocket('paint', { func: 'draw', isStart: false })
    },
    onViewResize() {
      this.onUpdateCanvasSize()
    },
    onUpdateCanvasSize() {
      this.$nextTick(() => {
        this.width = window.innerWidth - document.getElementById('layout_chat').clientWidth - document.getElementById('layout_cam').clientWidth
        this.height = window.innerHeight - document.getElementById('layout_top').clientHeight
        this.canvas.width = this.width
        this.canvas.height = this.height
      })
    },
    onChangePen(pen) {
      if (!this.isOwner) {
        return
      }

      if (pen.type === 'paint') {
        this.executeFunc(pen.func)
      } else if (pen.type === 'pen') {
        this.pen.type = pen.pen
      } else if (pen.type === 'color') {
        this.pen.type = pen.pen
        this.pen.color = pen.color
      }
    },
    executeFunc(func) {
      const funcName = `on${func}`

      if (!this[funcName]) {
        alert(`${funcName}은(는) 존재하지 않는 기능입니다.`)
      } else {
        this[funcName]()
      }
    },
    onAllClear() {
      this.sendSocket('paint', { func: 'AllClear' })
      this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height)
    },
    /**
     * 상대방에게 나의 페인트 정보 전송
     *
     * @method sendSocket
     * @param {String} msgType 메세지 타입
     * @param {Object} data 전송 할 데이터
     */
    sendSocket(msgType, data) {
      let request = {}
      request.msgType = msgType
      request.data = data

      this.$EventBus.emit('paint', request)
    },
    /**
     * 캔버스에 이미지 그리기
     *
     * @method drawImage
     * @param {String} 이미지 URL
     */
    drawImage(url) {
      const img = new Image()
      img.src = url
      img.onload = () => {
        const isWidthFull = this.width >= img.width? false : true
        const imgDom = document.createElement('img')
        imgDom.src = url
        imgDom.width = this.width >= img.width? img.width : this.width
        imgDom.height = imgDom.width / (imgDom.width / img.height)

        this.$refs.viewer.append(imgDom)

        this.sendSocket('paint-img', {
          url: url,
          isWidthFull: isWidthFull,
          imgWidth: img.width,
          imgWidthPercent: img.width / this.canvas.width,
          imgHeightPercent : img.height / this.canvas.height
        })
      }
    },
    /**
     * 서버에서 받은 이미지 정보
     *
     * @method receiveDrawImage
     * @param {Object} data 이미지 정보
     */
    receiveDrawImage(data) {
      console.log(data)
      const imgDom = document.createElement('img')
      imgDom.src = data.url
      imgDom.width = data.isWidthFull? this.width : this.width * data.imgWidthPercent
      imgDom.height = this.height * data.imgHeightPercent

      this.$refs.viewer.append(imgDom)
    }
  }
}
</script>

<style scoped>
#layout_paint {
  width: 100%;
  height: 100%;
  position: relative;
}

#canvas {
  border: 1px solid;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
}

#layout_viewer{
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}
</style>
