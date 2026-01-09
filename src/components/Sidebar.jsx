import React from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  const menuItems = [
    { path: "/", name: "Dashboard", icon: "🏠" },
    { path: "/movies", name: "Movies", icon: "🎬" },
    { path: "/episodes", name: "Episodes", icon: "📺" },
    { path: "/transactions", name: "Transactions", icon: "💳" },
    { path: "/wallet", name: "Wallet", icon: "💰" },
  ];

  return (
    <>
      {isOpen && <div className="sidebar-overlay active" onClick={onClose} />}

      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2>Menu</h2>
        </div>
        <ul>
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={location.pathname === item.path ? "active" : ""}
                onClick={onClose}
              >
                <span className="icon">{item.icon}</span>
                <span className="text">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default Sidebar;
