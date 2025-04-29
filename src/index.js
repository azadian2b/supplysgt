import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Amplify } from 'aws-amplify';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import { DataStore } from '@aws-amplify/datastore';
import { User, UIC, UICMembershipRequest } from './models';
import awsconfig from './aws-exports';

// Configure Amplify
Amplify.configure(awsconfig);

// Initialize DataStore with all configurations in one call
DataStore.configure({
  errorHandler: error => {
    console.log('DataStore error', error);
  },
  // Use the syncWithoutCredentials option for models that should be available to all users
  syncWithoutCredentials: true, 
  // Configure model-specific sync behaviors
  syncExpressions: {
    User: () => c => c.owner.eq('${identityId}'),
    UIC: () => c => c, // Get all UICs
    UICMembershipRequest: () => c => c.or(c => [
      c.userID.eq('${identityId}'),
      // Add additional conditions for approvers here if needed
    ])
  }
});

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
