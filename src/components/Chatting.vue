<template>
  <div id="layout_chatting">
    <div id="layout_input">
      <input
        type="text"
        v-model="chatMsg">
      <button @click="onClickSend">전송</button>
    </div>
    <div id="layout_chat_log">
      <template v-for="(item, index) in chats" :key="index">
        <div v-if="item.sendId === 'System'" class='chat_log_system'>
            {{ item.msg }}
        </div>
        <div v-else :class="[ 'chat_log', item.isSelfSend? 'chat_log_self' : 'chat_log_opponent' ]">
          <div>
            <p v-if="!item.isSelfSend">{{ item.sendId }}: </p>
            <span v-if="!item.isSelfSend">&nbsp;&nbsp;&nbsp;&nbsp;</span>
            {{ item.msg }}
          </div>
        </div>
      </template>
    </div>
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
      this.$EventBus.on('chatReceive', (data) => {
        this.addChatMsg(data.data.sendId, data.data.msg, false)
      })
    },
    getChatMsgClass() {

    },
    unMounted() {
      this.$EventBus.off('chatReceive')
    },
    onClickSend() {
      if (this.chatMsg !== '') {
        this.addChatMsg(this.id, this.chatMsg, true)
        this.sendSocket(this.id, this.roomId, this.chatMsg)
        this.chatMsg = ''
      }
    },
    sendSocket(id, roomId, chatMsg) {
      let request = {}
      request.msgType = 'chat'
      request.data = {
        sendId: id,
        roomId: roomId,
        msg: chatMsg,
        isSelfSend: false
      }

      this.$EventBus.emit('chat', request)
    },
    /**
     * 채팅 메세지 추가
     *
     * @method addChatMsg
     * @param {String} sendId 채팅메세지 전송한 사용자
     * @param {String} msg 채팅 메세지
     * @param {Boolean} isSelfSend 본인이 보냈는지 유무(true 본인 보냄, false 타인이 보냄)
     */
    addChatMsg(sendId = '', msg = '', isSelfSend = true) {
      this.chats.push({
        sendId: sendId,
        msg: msg,
        isSelfSend: isSelfSend
      })
    }
  }
}
</script>

<style scoped>
#layout_chatting {
  display: flex;
  flex-direction: column;
}

#layout_input {
  flex-basis: 30px;
}

#layout_chat_log {
  flex-grow: 1;
}

#layout_chat_log > .chat_log {
  width: 100%;
}

#layout_chat_log > .chat_log > div {
  background-color: cornsilk;
  padding: 2px;
  margin: 6px;
}

.chat_log_system {
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.chat_log_self {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.chat_log_opponent {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}
</style>
