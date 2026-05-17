import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { AlertTriangle, CheckCircle, Clock, ShieldAlert, MapPin, Thermometer, Weight, Eye } from 'lucide-react';
import api from '../api/axios';
import { useVehicles } from '../context/VehicleContext';

const Alerts = () => {
  const { selectedVehicle } = useVehicles();
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchViolations();
  }, [selectedVehicle]);

  const fetchViolations = async () => {
    setLoading(true);
    try {
      // Fetch all violations, we filter by selected vehicle in the UI or by API if we want
      const res = await api.get('violations/');
      if (selectedVehicle) {
        setViolations(res.data.filter(v => v.device_id === selectedVehicle.device_id));
      } else {
        setViolations(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch violations');
    } finally {
      setLoading(false);
    }
  };

  const getViolationIcon = (type) => {
    switch (type) {
      case 'ALCOHOL': return <ShieldAlert color="var(--danger)" />;
      case 'DROWSINESS': return <Eye color="var(--warning)" />;
      case 'OVERLOAD': return <Weight color="var(--danger)" />;
      case 'TEMPERATURE': return <Thermometer color="var(--danger)" />;
      default: return <AlertTriangle color="var(--accent-color)" />;
    }
  };

  return (
    <Layout>
      <div className="dashboard-header">
        <h1>Safety Violation History</h1>
        <p>Comprehensive audit log of detected vulnerabilities {selectedVehicle ? `for ${selectedVehicle.vehicle_name}` : ''}</p>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="text-center py-20">Loading history...</div>
        ) : violations.length === 0 ? (
          <div className="premium-card glassmorphism text-center py-20">
            <CheckCircle size={48} color="var(--success)" className="mx-auto mb-4" />
            <h2>No Vulnerabilities Found</h2>
            <p>Your fleet is currently operating within safety parameters.</p>
          </div>
        ) : (
          <div className="violation-list">
            {violations.map(v => (
              <div key={v.id} className="premium-card violation-card glassmorphism mb-6">
                <div className="violation-header">
                  <div className="violation-title">
                    <div className="alert-icon-bg">
                      {getViolationIcon(v.violation_type)}
                    </div>
                    <div>
                      <h3>{v.violation_type.replace('_', ' ')} Detected</h3>
                      <p className="violation-time">
                        <Clock size={14} /> {new Date(v.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="violation-location">
                    <MapPin size={16} /> 
                    <span>{v.latitude?.toFixed(4)}, {v.longitude?.toFixed(4)}</span>
                  </div>
                </div>
                
                <div className="snapshot-grid mt-4">
                  <div className="snapshot-item">
                    <span className="snapshot-label">Temp:</span>
                    <span className="snapshot-value">{v.snapshot_data?.temp}°C</span>
                  </div>
                  <div className="snapshot-item">
                    <span className="snapshot-label">Load:</span>
                    <span className="snapshot-value">{v.snapshot_data?.load} kg</span>
                  </div>
                  <div className="snapshot-item">
                    <span className="snapshot-label">Alcohol:</span>
                    <span className="snapshot-value">{v.snapshot_data?.alcohol}</span>
                  </div>
                  <div className="snapshot-item">
                    <span className="snapshot-label">Driver:</span>
                    <span className="snapshot-value">{v.snapshot_data?.drowsy}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Alerts;
