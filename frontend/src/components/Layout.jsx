import React from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useVehicles } from '../context/VehicleContext';
import { User, Bell, Truck } from 'lucide-react';

const Layout = ({ children }) => {
  const { user } = useAuth();
  const { vehicles, selectedVehicle, changeVehicle } = useVehicles();

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-wrapper">
        <header className="top-header glassmorphism">
          <div className="global-vehicle-switcher">
            <Truck size={20} className="switcher-icon" />
            <select 
              className="premium-select"
              value={selectedVehicle?.id || ''} 
              onChange={(e) => changeVehicle(vehicles.find(v => v.id === parseInt(e.target.value)))}
            >
              <option value="" disabled>Select Vehicle</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.vehicle_name} ({v.vehicle_number})</option>
              ))}
              {vehicles.length === 0 && <option value="" disabled>No vehicles registered</option>}
            </select>
          </div>

          <div className="header-actions">
            <button className="icon-btn"><Bell size={20} /></button>
            <div className="user-profile">
              <div className="user-info">
                <span className="user-name">{user?.name || user?.username || 'Guest'}</span>
                <span className="user-role">Vehicle Owner</span>
              </div>
              <div className="user-avatar">
                <User size={24} />
              </div>
            </div>
          </div>
        </header>
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
