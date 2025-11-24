import React from 'react';
import './Header.css';

export default function Header({ toggleSidebar, sidebarVisible }) {
  return (
    <header className="header-bar">
      <div className="header-left">
        <button
          className="sidebar-toggle"
          aria-label={sidebarVisible ? 'Close sidebar' : 'Open sidebar'}
          onClick={toggleSidebar}
        >
          <i className={sidebarVisible ? 'fas fa-times' : 'fas fa-bars'} />
        </button>
      </div>

      <div className="header-title">Staff Page</div>
      <a className="header-home-btn" href="/">Home</a>
    </header>
  );
}
