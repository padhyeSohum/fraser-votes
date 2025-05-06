
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import App from './App.tsx'
import './index.css'
import './lib/firebase' // Initialize Firebase

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("Failed to find the root element");
} else {
  try {
    const root = createRoot(rootElement);
    
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    
    console.log("Application successfully rendered");
  } catch (error) {
    console.error("Error rendering the application:", error);
  }
}
