import React from 'react';

const Navbar = ({ onLogout, onToggleTheme, isDarkMode, onToggleSidebar, isSidebarOpen }) => {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        {/* Hamburger - only visible on mobile */}
        <button className="hamburger-btn" onClick={onToggleSidebar}>
          {isSidebarOpen ? '✖' : '☰'}
        </button>
        <h1>ToriBox Admin</h1>
      </div>

      <div className="nav-buttons">
        <button onClick={onToggleTheme}>
          {isDarkMode ? '☀️ ' : '🌙 '}
        </button>
        <button onClick={onLogout}>
          🚪 Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;