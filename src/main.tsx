import React from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import '@fontsource-variable/manrope'
import '@fontsource-variable/lora'
import './styles/global.css'
import './styles/pages.css'
import App from './App'

// Service worker: офлайн-работа и установка как приложение
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
