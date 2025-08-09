import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById('root');
  
  if (rootElement) {
    try {
      const root = ReactDOM.createRoot(rootElement);
      root.render(<App />);
    } catch (error) {
      console.error('Error creating React root:', error);
    }
  } else {
    console.error('Root element not found');
  }
});
