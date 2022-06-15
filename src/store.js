import { createStore } from 'vuex'

export default createStore({
  state: {
    userId: '',
    roomId: ''
  },
  getters: {
    isOwner(state) {
      return state.userId === state.roomId
    }
  },
  mutations: {
    setUserInfo(state, value) {
      state.userId = value.userId
    },
    setRoomInfo(state, value) {
      state.roomId = value.roomId
    }
  }
})