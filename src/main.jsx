import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { applyDocumentLanguage } from '@/lib/i18n'

applyDocumentLanguage();

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
