import React from 'react'
import ReactDOM from 'react-dom/client'
import { setCurrentLocale } from '@fayz-ai/core'
import { App } from './App'
import './styles.css'

setCurrentLocale('en')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
