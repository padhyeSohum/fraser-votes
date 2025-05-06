
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import App from './App.tsx'
import './index.css'
import './lib/firebase' // Initialize Firebase
import PWAInstallPrompt from './components/PWAInstallPrompt'

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("Failed to find the root element");
} else {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
        <PWAInstallPrompt />
      </StrictMode>
    );
    console.log("Application successfully rendered");
  } catch (error) {
    console.error("Error rendering the application:", error);
  }
}
