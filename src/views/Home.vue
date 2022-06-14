<template>
  <div id="layout">
    <input
        type="text"
        placeholder="사용자 아이디를 입력해주세요."
        v-model="id">
    <input
      type="text"
      placeholder="방(상대방 아이디) 코드를 입력해주세요."
      v-model="roomId">
    <button @click="onClickJoin">입장</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      id: '',
      roomId: ''
    }
  },
  created() {
    console.log('craete')
  },
  mounted() {
    console.log('mounted')
    this.id = this.getUUIDv4()
  },
  methods: {
    onClickJoin() {
      this.$router.push({ name: 'Room', query: { roomId: this.roomId, id: this.id } })
    },
    getUUIDv4() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	      let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    }
  }
}
</script>

<style scoped>
#layout {
  text-align: center;
}
</style>