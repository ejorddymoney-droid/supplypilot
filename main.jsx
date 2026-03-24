import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './src/App.jsx'
// Note: Original monolith was ./App.jsx — now modularized into src/

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
