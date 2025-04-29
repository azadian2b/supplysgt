import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './App.css';
import './styles/Theme.css';
import ProfilePage from './pages/ProfilePage';
import UpdateNotification from './components/UpdateNotification';

// Pages
import Home from './pages/Home';
import Manage from './pages/Manage';
import Assign from './pages/Assign';
import Issue from './pages/Issue';
import Accountability from './pages/Accountability';
import DataInspector from './utils/DataInspector';

// Components
import Header from './components/Header';
import Footer from './components/Footer';

// Import and configure Amplify with aws-exports
import awsExports from './aws-exports';
Amplify.configure(awsExports);

// Navigation restoration component
function NavigationRestorer() {
  const navigate = useNavigate();
  
  useEffect(() => {
    const savedPath = sessionStorage.getItem('returnToPath');
    if (savedPath) {
      // Navigate to the saved path
      navigate(savedPath, { replace: true });
      // Remove the saved path
      sessionStorage.removeItem('returnToPath');
    }
  }, [navigate]);
  
  return null;
}

function App() {
  return (
    <Authenticator 
      services={{
        validateCustomSignUp: async (formData) => {
          if (!formData.email) {
            return {
              email: 'Email is required',
            };
          }
        }
      }}
    >
      {({ signOut, user }) => (
        <Router>
          <div className="App">
            <Header signOut={signOut} user={user} />
            <NavigationRestorer />
            <main className="App-main">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/manage" element={<Manage />} />
                <Route path="/assign" element={<Assign />} />
                <Route path="/issue" element={<Issue />} />
                <Route path="/accountability" element={<Accountability />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/debug" element={<DataInspector />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
          <UpdateNotification />
        </Router>
      )}
    </Authenticator>
  );
}

export default App;
