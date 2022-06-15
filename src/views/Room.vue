<template>
  <div id="wrap">
    <div id="layout_top">
      <button @click="onClickPaintPen(paintPen.allClear)">전체 지우기</button>
      <button @click="onClickPaintPen(paintPen.eraser)">지우개</button>
      <button @click="onClickPaintPen(paintPen.pen)">펜</button>
      <button @click="onClickPaintPen(paintPen.color1)">색상 빨강</button>
      <button @click="onClickPaintPen(paintPen.color2)">생상 초록</button>
      <button @click="onClickPaintPen(paintPen.color3)">색상 파랑</button>
    </div>
    <div id="layout_content">
      <div id="layout_chat">
        <chatting />
      </div>
      <div id="layout_canvas">
        <paint
          ref="paint" />
      </div>
      <div id="layout_cam">
        <cam />
      </div>
      <peer />
    </div>
  </div>
</template>

<script>
import Chatting from '@/components/Chatting'
import Paint from '@/components/Paint'
import Cam from '@/components/Cam'
import Peer from '@/components/Peer'

export default {
  components: {
    Chatting,
    Paint,
    Cam,
    Peer
  },
  data() {
    return {
      id: '',
      roomId: '',
      paintPen: {
        allClear: {
          type: 'paint',
          func: 'AllClear'
        },
        eraser: {
          type: 'pen',
          pen: 'eraser'
        },
        pen: {
          type: 'pen',
          pen: 'pen'
        },
        color1: {
          type: 'color',
          pen: 'pen',
          color: '#FF0000'
        },
        color2: {
          type: 'color',
          pen: 'pen',
          color: '#1DDB16'
        },
        color3: {
          type: 'color',
          pen: 'pen',
          color: '#0100FF'
        }
      }
    }
  },
  created() {
    console.log('craete')
    this.id = this.$route.query.id
    this.roomId = this.$route.query.roomId
  },
  mounted() {
    console.log('mounted')
  },
  methods: {
    onClickPaintPen(pen) {
      this.$refs.paint.onChangePen(pen)
    }
  }
}
</script>

<style scoped>
#wrap {
  width: 100%;
  height: 100%;
}

#layout_top {
  height: 60px;
  background-color: burlywood;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-content: center;
  justify-content: center;
}

#layout_top > button {
  margin-left: 6px;
  margin-right: 6px;
  height: 40px;
}

#layout_content {
  height: calc(100% - 60px);
  display: flex;
}

#layout_content > #layout_chat {
  background-color: darkseagreen;
  flex-basis: 260px;
  flex-shrink: 0;
  height: 100%;
}

#layout_content > #layout_canvas {
  flex-grow: 1;
  height: 100%;
}

#layout_content > #layout_cam {
  flex-basis: 260px;
  flex-shrink: 0;
  height: 100%;
}
</style>