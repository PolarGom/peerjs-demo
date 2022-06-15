<template>
  <div id="layout_cam_list" ref="cams">
  </div>
</template>

<script>
export default {
  data() {
    return {
      chatMsg: '',
      chats: []
    }
  },
  created() {
  },
  mounted() {
    this.init()
  },
  unmounted() {
    this.unMounted()
  },
  methods: {
    init() {
      this.$EventBus.on('videoStream', this.addVideoStream)
      this.$EventBus.on('videoStreamRemove', this.removeVideoStream)
    },
    unMounted() {
      this.$EventBus.off('videoStream')
      this.$EventBus.off('videoStreamRemove')
    },
    addVideoStream(data) {
      if (document.getElementById(`cam-${data.userId}`) !== null) {
        return
      }

      let videoDom = document.createElement('video')
      videoDom.width = document.getElementById('layout_cam').clientWidth
      videoDom.muted = true
      videoDom.id = `cam-${data.userId}`
      videoDom.srcObject = data.stream
      videoDom.addEventListener('loadedmetadata', () => {
        videoDom.play()
      })

      this.$refs.cams.append(videoDom)
    },
    removeVideoStream(data) {
      document.getElementById(`cam-${data.userId}`).remove()
    }
  }
}
</script>

<style scoped>
#layout_cam_list {
  display: flex;
  width: 100%;
  flex-direction: column;
}
</style>