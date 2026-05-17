import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { VehicleProvider } from './context/VehicleContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Tracking from './pages/Tracking';
import Monitoring from './pages/Monitoring';
import Alerts from './pages/Alerts';
import './styles/index.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <VehicleProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            <Route path="/vehicles" element={
              <PrivateRoute>
                <Vehicles />
              </PrivateRoute>
            } />
            <Route path="/tracking" element={
              <PrivateRoute>
                <Tracking />
              </PrivateRoute>
            } />
            <Route path="/monitoring" element={
              <PrivateRoute>
                <Monitoring />
              </PrivateRoute>
            } />
            <Route path="/alerts" element={
              <PrivateRoute>
                <Alerts />
              </PrivateRoute>
            } />
          </Routes>
        </Router>
      </VehicleProvider>
    </AuthProvider>
  );
}

export default App;
