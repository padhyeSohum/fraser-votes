
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import App from './App.tsx'
import './index.css'
import './lib/firebase' // Initialize Firebase

// Function to create and render the root
const renderApp = async () => {
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
    
    console.log("Application successfully rendered");
  } catch (error) {
    console.error("Error rendering the application:", error);
  }
};

// Use requestIdleCallback for non-critical initialization
// This allows the browser to prioritize more important tasks first
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    renderApp();
  });
} else {
  // Fallback for browsers that don't support requestIdleCallback
  setTimeout(renderApp, 1);
}
