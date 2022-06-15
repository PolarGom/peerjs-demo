<template>
  &nbsp;
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  data() {
    return {
      peer: null,
      conn: null,
      peers: {},
      peerCalls: {},
      reconnectTimer: null,
      videoStream: null
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
  computed: {
    ...mapGetters({
      isOwner: 'getIsOwner',
      userId: 'getUserId',
      roomId: 'getRoomId'
    })
  },
  methods: {
    unMounted() {
      if (this.isOwner) {
        Object.values(this.peers).forEach(o => {
          o.close()
        })
      } else {
        this.conn.close()
      }

      this.peer.disconnect()
      this.$EventBus.off('chat')
      this.$EventBus.off('paint')

      if (this.reconnectTimer !== null) {
        window.clearTimeout(this.reconnectTimer)
      }
    },
    init() {
      this.$EventBus.on('chat', (data) => {
        this.sendData(data)
      })
      this.$EventBus.on('paint', (data) => {
        if (this.isOwner) {
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
        this.videoStream = stream
        this.$EventBus.emit('videoStream', { userId: this.userId, stream: stream })

        this.createPeer()
      }).catch((error) => {
        console.log(error)
        this.emitChatEventBusBySystem('카메라 및 오디오를 거부하였습니다.')
        this.createPeer()
      })
    },
    createPeer() {
      console.log('접속 아이디: ', this.userId, '접속 룸: ', this.roomId)

      this.peer = new window.Peer(this.userId)
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

      this.emitChatEventBusBySystem(`${connection.peer} 님이 접속하였습니다.`)

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
        delete this.peerCalls[connection.peer]

        console.log('남은 상대방 수: ', Object.keys(this.peers))
        this.$EventBus.emit('videoStreamRemove', { userId: connection.peer })
      })

      // call 을 한번 호출해도 오디오와 비디오를 활성화 시켰다면 on('stream'...) 을 두번 호출한다. on('call'...) 또한 마찬가지이다.
      this.peerCalls[connection.peer] = this.peer.call(connection.peer, this.videoStream)
      this.peerCalls[connection.peer].on('stream', (userVideoStream) => {
        this.emitEventBus({ msgType: 'video', data: { event: 'videoStream', userId: connection.peer, stream: userVideoStream } })
      })
      this.peerCalls[connection.peer].on('close', () => {
        console.log('종료')
        this.emitEventBus({ msgType: 'video', data: { event: 'videoStreamRemove', userId: connection.peer } })
      })
    },
    onOpen(id) {
      console.log('My Peer Id: ', id)

      this.roomConnect()

      this.peer.on('call', (call) => {
        call.answer(this.videoStream)
        call.on('stream', (userVideoStream) => {
	        this.emitEventBus({ msgType: 'video', data: { event: 'videoStream', userId: call.peer, stream: userVideoStream } })
        })
      })
    },
    roomConnect() {
      if (this.isOwner) {
        console.log('동일한 아이디에 동일한 방 아이디는 커넥션 할 필요가 없습니다.')
        return
      }

      if (this.reconnectTimer !== null) {
        window.clearTimeout(this.reconnectTimer)
      }

      this.conn = this.peer.connect(this.roomId)
      this.conn.on('open', () => {
        console.log('방 접속 성공: ', this.roomId)
        this.emitChatEventBusBySystem('방에 접속하였습니다.')
      })
      this.conn.on('data', (data) => {
        // console.log('방 Received', data)
        this.emitEventBus(data)
      })
      this.conn.on('close', () => {
        console.log('방과의 접속이 닫혔습니다.')
        this.emitEventBus({ msgType: 'video', data: { event: 'videoStreamRemove', userId: this.roomId } })
        this.emitChatEventBusBySystem('방과의 연결에 끊겼습니다. 재접속을 시도합니다.')
        this.roomReconnect()
      })
    },
    roomReconnect() {
      if (!this.isOwner) {
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
      if (this.isOwner) {
        // 방장인 경우
        Object.values(this.peers).forEach(o => {
          o.send(data)
        })
      } else {
        // 방장이 아닌 경우
        this.conn.send(data)
      }
    },
    emitEventBus(data) {
      if (data.msgType === 'chat') {
        this.$EventBus.emit('chatReceive', data)
      } else if (data.msgType === 'paint') {
        this.$EventBus.emit('paintReceive', data)
      } else if (data.msgType === 'video') {
        this.$EventBus.emit(data.data.event, data.data)
      }
    },
    emitChatEventBusBySystem(msg) {
      this.emitEventBus({ msgType: 'chat', data: { sendId: 'System', msg: msg } })
    }
  }
}
</script>
