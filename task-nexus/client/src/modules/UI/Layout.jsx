import React, { useContext } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { LayoutDashboard, Building2, LogOut, User, Moon } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toggleTheme } = useContext(ThemeContext);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">

      {/* SIDEBAR */}
      <aside className="sidebar glass">
        <div className="sidebar-header">
          <h1 className="sidebar-logo">
            Task<span className="text-primary">Nexus</span>
          </h1>
        </div>

        {/* NAV */}
        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/workspaces" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Building2 size={20} />
            <span>Workspaces</span>
          </NavLink>
        </nav>

        {/* FOOTER */}
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              <User size={18}/>
            </div>
            <div className="user-details">
              <span className="user-name">
                {user?.username || user?.data?.username || 'User'}
              </span>
              <span className="user-email">
                {user?.email || user?.data?.email || ''}
              </span>
            </div>
          </div>

          {/* DARK MODE */}
          <button className="btn-ghost" onClick={toggleTheme}>
            <Moon size={18}/> Theme
          </button>

          {/* LOGOUT */}
          <button className="btn-ghost logout-btn" onClick={handleLogout}>
            <LogOut size={18}/>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main-content">
        <Outlet />
      </main>

    </div>
  );
}
