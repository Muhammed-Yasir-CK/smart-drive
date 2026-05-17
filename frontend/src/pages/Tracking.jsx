import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { MapPin, Navigation, Truck } from 'lucide-react';
import { useVehicles } from '../context/VehicleContext';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';

const Tracking = () => {
  const { selectedVehicle } = useVehicles();
  const [location, setLocation] = useState({ lat: 0, lng: 0, lastUpdate: '--' });

  useEffect(() => {
    if (selectedVehicle) {
      const sensorRef = ref(db, `sensor_data/${selectedVehicle.device_id}`);
      const unsubscribe = onValue(sensorRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.latitude && data.longitude) {
          const ts = data.timestamp ? (data.timestamp > 2000000000 ? data.timestamp : data.timestamp * 1000) : Date.now();
          setLocation({
            lat: data.latitude,
            lng: data.longitude,
            lastUpdate: new Date(ts).toLocaleTimeString()
          });
        }
      });
      return () => unsubscribe();
    }
  }, [selectedVehicle]);

  return (
    <Layout>
      <div className="dashboard-header">
        <h1>Live Vehicle Tracking</h1>
        <p>Real-time GPS positioning and route monitoring</p>
      </div>

      {!selectedVehicle ? (
        <div className="premium-card glassmorphism text-center py-20">
          <Truck size={48} color="var(--accent-color)" className="mx-auto mb-4" />
          <h2>No Vehicle Selected</h2>
          <p>Please select a vehicle to start tracking.</p>
        </div>
      ) : (
        <div className="grid-2">
          <div className="premium-card glassmorphism h-600 relative overflow-hidden">
            <div className="map-overlay">
              <div className="status-badge resolved">
                <Navigation size={14} /> ACTIVE TRACKING
              </div>
            </div>
            <div className="map-placeholder h-full flex items-center justify-center">
               <div className="text-center">
                 <MapPin size={48} color="var(--danger)" className="mx-auto mb-4 animate-bounce" />
                 <p className="pulse-text">{selectedVehicle.vehicle_name} is at {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
                 <span className="text-secondary">Last updated: {location.lastUpdate}</span>
               </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="premium-card glassmorphism">
              <h3 className="mb-4">Vehicle Details</h3>
              <div className="detail-item">
                <span>Name:</span> <strong>{selectedVehicle.vehicle_name}</strong>
              </div>
              <div className="detail-item">
                <span>Number:</span> <strong>{selectedVehicle.vehicle_number}</strong>
              </div>
              <div className="detail-item">
                <span>Device ID:</span> <strong>{selectedVehicle.device_id}</strong>
              </div>
            </div>
            
            <div className="premium-card glassmorphism flex-1">
              <h3 className="mb-4">Recent Route</h3>
              <div className="empty-state text-secondary text-sm">
                Route history for today will appear here.
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Tracking;
