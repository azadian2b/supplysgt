import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './App.css';
import './styles/Theme.css';
import './styles/Buttons.css';
import ProfilePage from './pages/ProfilePage';

// Pages
import Home from './pages/Home';
import Manage from './pages/Manage';
import Assign from './pages/Assign';
import Issue from './pages/Issue';
import Accountability from './pages/Accountability';
import Admin from './pages/Admin';

// Components
import Header from './components/Header';
import Footer from './components/Footer';

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
                <Route path="/admin" element={<Admin />} />
                <Route path="/debug" element={<Navigate to="/admin" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      )}
    </Authenticator>
  );
}

export default App;
