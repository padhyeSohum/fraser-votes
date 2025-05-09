
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import App from './App.tsx'
import './index.css'
import './lib/firebase' // Initialize Firebase

// Function to create and render the root with improved error handling and performance
const renderApp = () => {
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    console.error("Failed to find the root element");
    return;
  }
  
  try {
    const root = createRoot(rootElement);
    
    // Render with strict mode
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    
    // Hide the initial loader once React has mounted
    const initialLoader = document.getElementById('initial-loader');
    if (initialLoader) {
      initialLoader.style.opacity = '0';
      setTimeout(() => {
        initialLoader.style.display = 'none';
      }, 300); // Match this with the CSS transition duration
    }
    
    console.log("Application successfully rendered");
  } catch (error) {
    console.error("Error rendering the application:", error);
    // Show error message in the loading screen if rendering fails
    const message = document.querySelector('#initial-loader .message');
    if (message) {
      message.textContent = "Error loading application. Please refresh the page.";
    }
  }
};

// Render as soon as possible - don't delay with requestIdleCallback
// This improves perceived performance
renderApp();
