import React from 'react';
import ReactDOM from 'react-dom/client';
import './configureAmplify';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { setupAuthListener } from './utils/DataSyncManager';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// Set up auth listener for sign-in/sign-out events
setupAuthListener();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// The PWA shell is not a source of business truth. Keep service workers
// disabled until caching/update behavior is deliberately reintroduced.
serviceWorkerRegistration.unregister();
