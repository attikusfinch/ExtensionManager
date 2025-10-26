import React from 'react'
import ReactDOM from 'react-dom/client'
import { Buffer } from 'buffer'
import App from './App.jsx'
import './index.css'

// Полифил для Buffer (требуется для @ton/ton)
window.Buffer = Buffer

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)

