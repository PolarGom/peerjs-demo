<template>
  챗
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
      peer: null,
      conn: null,
      peers: {},
      reconnectTimer: null
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
    unMounted() {
      if (this.isOwner()) {
        Object.values(this.peers).forEach(o => {
          o.close()
        })
      } else {
        this.conn.close()
      }

      this.peer.disconnect()
      this.$EventBus.off('chat')
      this.$EventBus.off('paint')
    },
    init() {
      this.$EventBus.on('chat', (data) => {
        this.sendData(data)
      })
      this.$EventBus.on('paint', (data) => {
        if (this.isOwner()) {
          this.sendData(data)
        }
      })

      this.onInitPeer()
    },
    onInitPeer() {
      window.navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      }).then((stream) => {
        this.createPeer(stream)
      }).catch((error) => {
        console.log(error)
        alert('카메라 및 오디오를 거부하였습니다.')
        this.createPeer(null)
      })
    },
    createPeer(stream) {
      console.log('접속 아이디: ', this.id, '접속 룸: ', this.roomId, '스트림 정보: ', stream)

      this.peer = new window.Peer(this.id)
      this.peer.on('open', this.onOpen)
      this.peer.on('error', (error) => {
        console.log('My Peer error: ', error)
        this.roomReconnect()
      })
      this.peer.on('disconnected', () => {
        console.log('My Peer Disconnected')
      })
      this.peer.on('connection', this.onOpponentConnect)
    },
    onOpponentConnect(connection) {
      console.log('상대방 접속 성공: ', connection)

      this.emitEventBusBySystem(`${connection.peer} 님이 접속하였습니다.`)

      this.peers[connection.peer] = connection
      this.peers[connection.peer].on('error', (error) => {
        console.log('상대방 커넥션 에러: ', error)
      })
      this.peers[connection.peer].on('data', (data) => {
        console.log('상대방 리시브: ', data)
        this.emitEventBus(data)
        this.sendSpreadData(data)
      })
      this.peers[connection.peer].on('close', () => {
        console.log('상대방과의 접속이 닫혔습니다.: ', connection.peer)

        delete this.peers[connection.peer]

        console.log('남은 상대방 수: ', Object.keys(this.peers))
      })
    },
    onOpen(id) {
      console.log('My Peer Id: ', id)

      this.roomConnect()
    },
    roomConnect() {
      if (this.isOwner()) {
        console.log('동일한 아이디에 동일한 방 아이디는 커넥션 할 필요가 없습니다.')
        return
      }

      if (this.reconnectTimer !== null) {
        window.clearTimeout(this.reconnectTimer)
      }

      this.conn = this.peer.connect(this.roomId)
      this.conn.on('open', () => {
        console.log('방 접속 성공: ', this.roomId)
        this.emitEventBusBySystem('방에 접속하였습니다.')
      })
      this.conn.on('data', (data) => {
        // console.log('방 Received', data)
        this.emitEventBus(data)
      })
      this.conn.on('close', () => {
        console.log('방과의 접속이 닫혔습니다.')
        this.roomReconnect()
      })
      this.conn.on('disconnected', () => {
        console.log('방과의 접속이 끊겼습니다.')
      })
    },
    roomReconnect() {
      if (!this.isOwner()) {
        if (this.conn !== null) {
          this.conn.close()
        }

        this.conn = null

        if (this.peer !== null) {
          this.peer.disconnect()
        }

        this.reconnectTimer = window.setTimeout(() => {
          console.log('방에 재접속을 시도합니다.')
          this.onInitPeer()
        }, 5 * 1000)
      }
    },
    /**
     * 전달 받은 채팅을 나와 연결된 상대방들에게(전달 한 사용자 제외) 전파
     *
     * @method sendSpreadData
     */
    sendSpreadData(data) {
      const PEER_ID = 0
      const PEER_INFO = 1

      Object.entries(this.peers).filter(o => {
        return o[PEER_ID] !== data.data.sendId
      }).forEach(o => {
        o[PEER_INFO].send(data)
      })
    },
    sendData(data) {
      if (this.isOwner()) {
        // 방장인 경우
        Object.values(this.peers).forEach(o => {
          o.send(data)
        })
      } else {
        // 방장이 아닌 경우
        this.conn.send(data)
      }
    },
    isOwner() {
      return this.id === this.roomId
    },
    emitEventBus(data) {
      if (data.msgType === 'chat') {
        this.$EventBus.emit('chatReceive', data)
      } else if (data.msgType === 'paint') {
        this.$EventBus.emit('paintReceive', data)
      }
    },
    emitEventBusBySystem(msg) {
      this.emitEventBus({ msgType: 'chat', data: { sendId: 'System', msg: msg } })
    }
  }
}
</script>
