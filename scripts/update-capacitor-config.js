// This script updates the capacitor.config.ts file with the correct production URL when deploying
const fs = require('fs');
const path = require('path');

// Read the capacitor config file
const configPath = path.join(__dirname, '..', 'capacitor.config.ts');
let configContent = fs.readFileSync(configPath, 'utf8');

// For production builds, we want to use the actual deployed URL
// For development, we keep the local server URL
if (process.env.NODE_ENV === 'production') {
  // Replace the server URL with an empty object to use the bundled web assets
  configContent = configContent.replace(
    /server: {[\s\S]*?},/,
    '// Production mode uses bundled assets\n  server: {},\n'
  );
} else {
  // Development mode - restore the development URL if needed
  if (!configContent.includes('server: {')) {
    configContent = configContent.replace(
      'plugins: {',
      'server: {\n    url: \'https://6a43dc77-f4c3-4b0c-a76b-201b15f7ac81.lovableproject.com?forceHideBadge=true\',\n    cleartext: true\n  },\n  plugins: {'
    );
  }
}

// Write the updated config back to the file
fs.writeFileSync(configPath, configContent);
console.log('Capacitor config updated for', process.env.NODE_ENV === 'production' ? 'production' : 'development');
