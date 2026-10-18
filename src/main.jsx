import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { AuthProider } from './Middleware/Auth.jsx'

createRoot(document.getElementById('root')).render(
  <AuthProider>
    <StrictMode>
      <App />
    </StrictMode>
  </AuthProider>,
)
