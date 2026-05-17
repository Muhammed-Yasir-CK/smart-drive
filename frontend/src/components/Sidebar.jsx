import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, BarChart3, Bell, History, LogOut, Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Vehicles', path: '/vehicles', icon: <Truck size={20} /> },
    { name: 'Tracking', path: '/tracking', icon: <Map size={20} /> },
    { name: 'Monitoring', path: '/monitoring', icon: <BarChart3 size={20} /> },
    { name: 'Alerts', path: '/alerts', icon: <Bell size={20} /> },
    { name: 'Reports', path: '/reports', icon: <History size={20} /> },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <Truck size={32} color="var(--accent-color)" />
        <span>SmartDrive</span>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
      <button className="nav-item logout" onClick={logout}>
        <LogOut size={20} />
        <span>Logout</span>
      </button>
    </div>
  );
};

export default Sidebar;
