import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import store from './store'
import mitt from 'mitt'

const $EventBus = mitt()

const app = createApp(App)
app.use(router)
app.use(store)
app.mount('#app')

app.config.globalProperties.$EventBus = $EventBus
