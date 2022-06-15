import { createStore } from 'vuex'
import createPersistedState from 'vuex-persistedstate'

export default createStore({
  state: {
    userId: null,
    roomId: null
  },
  getters: {
    getIsOwner(state) {
      return state.userId === null || state.roomId === null? false : state.userId === state.roomId
    },
    getUserId(state) {
      return state.userId
    },
    getRoomId(state) {
      return state.roomId
    }
  },
  mutations: {
    setUserInfo(state, value) {
      state.userId = value.userId
    },
    setRoomInfo(state, value) {
      state.roomId = value.roomId
    }
  },
  plugins: [
    createPersistedState({
      storage: window.sessionStorage
    })
  ]
})