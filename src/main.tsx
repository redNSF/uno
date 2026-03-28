/**
 * main.tsx — App entry point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Hide the initial loading screen once React is ready
const loadingScreen = document.getElementById('loading-screen');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Fade out loading screen
setTimeout(() => {
  if (loadingScreen) {
    loadingScreen.classList.add('hidden');
    setTimeout(() => loadingScreen.remove(), 600);
  }
}, 300);
