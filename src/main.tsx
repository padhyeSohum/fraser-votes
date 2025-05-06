
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import App from './App.tsx'
import './index.css'
import './lib/firebase' // Initialize Firebase
import PWAInstallPrompt from './components/PWAInstallPrompt'

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <PWAInstallPrompt />
  </StrictMode>
);
