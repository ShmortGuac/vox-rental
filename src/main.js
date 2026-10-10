import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { loadCatalog } from './stores/catalog'
import './style.css'

loadCatalog()
createApp(App).use(router).mount('#app')
