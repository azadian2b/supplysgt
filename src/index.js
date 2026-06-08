import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Amplify } from 'aws-amplify';
import { DataStore } from '@aws-amplify/datastore';
import awsconfig from './aws-exports';
import { setupAuthListener } from './utils/DataSyncManager';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// Configure Amplify
Amplify.configure(awsconfig);

// Initialize DataStore with all configurations in one call
DataStore.configure({
  errorHandler: error => {
    console.log('DataStore error', error);
  }
});

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
