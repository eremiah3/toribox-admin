import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import Movies from './components/Movies.jsx';
import Episodes from './components/Episodes.jsx';
import Transactions from './components/Transactions.jsx';
import Wallet from './components/Wallet.jsx';
import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';

const API_BASE_URL = 'https://api.tori-box.com';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Check authentication and theme on mount
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) setIsAuthenticated(true);

    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme === 'true') {
      setIsDarkMode(true);
    }
  }, []);

  // Apply dark mode class to body
  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem('darkMode', isDarkMode);
  }, [isDarkMode]);

  const handleLogin = (token) => {
    localStorage.setItem('adminToken', token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    setIsAuthenticated(false);
    setIsSidebarOpen(false); // Close sidebar on logout
  };

  const toggleTheme = () => setIsDarkMode(prev => !prev);
  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="app">
        <Navbar
          onLogout={handleLogout}
          onToggleTheme={toggleTheme}
          isDarkMode={isDarkMode}
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />

        <div className="main-layout">
       <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

          <div className="content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/movies" element={<Movies apiBaseUrl={API_BASE_URL} />} />
              <Route path="/episodes" element={<Episodes apiBaseUrl={API_BASE_URL} />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/wallet" element={<Wallet />} />
              {/* Add more routes here later */}
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;