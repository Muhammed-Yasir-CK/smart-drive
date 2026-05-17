import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { Activity, Thermometer, Weight, Eye, Zap, MapPin, Clock, Truck, AlertTriangle } from 'lucide-react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import api from '../api/axios';
import { useVehicles } from '../context/VehicleContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { selectedVehicle } = useVehicles();
  const [liveData, setLiveData] = useState({
    location: 'Searching...',
    dateTime: '-- : --',
    temp: 0,
    load: 0,
    alcohol: 'Safe',
    drowsy: 'Awake',
    motor: 'OFF',
    alert: false
  });
  
  const [history, setHistory] = useState({ labels: [], temp: [], load: [] });
  const lastViolationRef = useRef({});

  useEffect(() => {
    if (selectedVehicle) {
      const sensorRef = ref(db, `sensor_data/${selectedVehicle.device_id}`);
      const unsubscribe = onValue(sensorRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const ts = data.timestamp ? (data.timestamp > 2000000000 ? data.timestamp : data.timestamp * 1000) : Date.now();
          const timestamp = new Date(ts).toLocaleTimeString();
          
          const newLiveData = {
            location: data.latitude && data.longitude ? `${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}` : 'Main Road, City',
            dateTime: new Date(ts).toLocaleString(),
            temp: data.temperature || 0,
            load: data.weight || 0,
            alcohol: data.alcohol_status || 'Safe',
            drowsy: data.status === 'DROWSY' ? 'Drowsy' : 'Awake',
            motor: data.system_active ? 'ON' : 'OFF',
            alert: data.alert || false,
            lat: data.latitude,
            lng: data.longitude,
          };
          
          setLiveData(newLiveData);
          
          // Update history for charts (max 15 points)
          setHistory(prev => {
            const labels = [...prev.labels, timestamp].slice(-15);
            const temp = [...prev.temp, newLiveData.temp].slice(-15);
            const load = [...prev.load, newLiveData.load].slice(-15);
            return { labels, temp, load };
          });

          checkViolations(newLiveData, selectedVehicle.device_id, data);
        }
      });
      return () => unsubscribe();
    }
  }, [selectedVehicle]);

  const checkViolations = async (data, vehicleId, rawData) => {
    const checkType = (type, isViolating) => {
      const now = Date.now();
      const lastTime = lastViolationRef.current[type] || 0;
      if (isViolating && (now - lastTime > 30000)) { // 30s cool down
        logViolation(type, data, vehicleId);
        lastViolationRef.current[type] = now;
      }
    };

    checkType('ALCOHOL', String(data.alcohol).toUpperCase() !== 'SAFE');
    checkType('DROWSINESS', data.drowsy === 'Drowsy');
    checkType('OVERLOAD', data.load > 0.16);
    checkType('TEMPERATURE', data.temp > 40);
  };

  const logViolation = async (type, snapshot, deviceId) => {
    try {
      await api.post('violations/', {
        device_id: deviceId,
        violation_type: type,
        snapshot_data: snapshot,
        latitude: snapshot.lat || 10.0,
        longitude: snapshot.lng || 76.0
      });
    } catch (err) {
      console.error('Failed to log violation');
    }
  };

  const chartData = {
    labels: history.labels,
    datasets: [
      {
        label: 'Temp (°C)',
        data: history.temp,
        borderColor: '#ff4d4d',
        backgroundColor: 'rgba(255, 77, 77, 0.2)',
        tension: 0.4,
      },
      {
        label: 'Load (kg)',
        data: history.load,
        borderColor: '#00d2ff',
        backgroundColor: 'rgba(0, 210, 255, 0.2)',
        tension: 0.4,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#888' } },
      x: { grid: { display: false }, ticks: { color: '#888' } }
    },
    plugins: { legend: { labels: { color: '#fff' } } }
  };

  const widgets = [
    { label: 'Motor Status', value: liveData.motor, icon: <Zap size={24} />, color: liveData.motor === 'ON' ? 'var(--success)' : 'var(--text-secondary)' },
    { label: 'Current Location', value: liveData.location, icon: <MapPin size={24} />, color: 'var(--accent-color)' },
    { label: 'Date and Time', value: liveData.dateTime, icon: <Clock size={24} />, color: 'var(--text-secondary)' },
    { label: 'Temperature', value: `${liveData.temp}°C`, icon: <Thermometer size={24} />, color: liveData.temp > 38 ? 'var(--danger)' : 'var(--success)' },
    { label: 'Load Weight', value: `${liveData.load} kg`, icon: <Weight size={24} />, color: liveData.load > 0.16 ? 'var(--danger)' : 'var(--accent-color)' },
    { label: 'Alcohol Status', value: liveData.alcohol, icon: <Activity size={24} />, color: String(liveData.alcohol).toUpperCase() !== 'SAFE' ? 'var(--danger)' : 'var(--success)' },
    { label: 'Driver Status', value: liveData.drowsy, icon: <Eye size={24} />, color: liveData.drowsy === 'Drowsy' ? 'var(--danger)' : 'var(--success)' },
  ];

  return (
    <Layout>
      <div className="dashboard-header">
        <h1>Vehicle Fleet Overview</h1>
        <div className="flex items-center gap-4">
           {liveData.alert && (
             <div className="alert-badge pulse">
               <AlertTriangle size={18} /> CRITICAL ALERT DETECTED
             </div>
           )}
           <p>Real-time telemetry and safety monitoring {selectedVehicle ? `for ${selectedVehicle.vehicle_name}` : ''}</p>
        </div>
      </div>

      {!selectedVehicle ? (
        <div className="premium-card glassmorphism text-center py-20">
          <Truck size={48} color="var(--accent-color)" className="mx-auto mb-4" />
          <h2>No Vehicle Selected</h2>
          <p>Please select or register a vehicle to see live data.</p>
        </div>
      ) : (
        <>
          <div className="dashboard-grid">
            {widgets.map((w, i) => (
              <div key={i} className="premium-card widget glassmorphism">
                <div className="widget-header" style={{ color: w.color }}>
                  {w.icon}
                  <span>{w.label}</span>
                </div>
                <div className="widget-value" style={{ fontSize: w.label === 'Date and Time' ? '1.2rem' : '1.8rem' }}>{w.value}</div>
                <div className="widget-label">Current Reading</div>
              </div>
            ))}
          </div>

          <div className="mt-8 grid-2">
            <div className="premium-card glassmorphism h-400">
               <div className="widget-header"><Activity size={20} /> Safety & Sensor Analytics</div>
               <div className="p-4 h-full" style={{ minHeight: '300px' }}>
                  <Line data={chartData} options={chartOptions} />
               </div>
            </div>
            <div className="premium-card glassmorphism h-400">
               <div className="widget-header"><AlertTriangle size={20} /> Real-time Alert Monitor</div>
               <div className="alert-list mt-4">
                  {liveData.drowsy === 'Drowsy' && <div className="alert-item danger">DROWSY ALERT: Driver fatigue detected!</div>}
                  {liveData.load > 0.16 && <div className="alert-item danger">WEIGHT OVERLOAD: Capacity exceeded (Limit: 0.16kg)</div>}
                  {String(liveData.alcohol).toUpperCase() !== 'SAFE' && <div className="alert-item danger">ALCOHOL DETECTED: Engine lock potential!</div>}
                  
                  {/* Only show secure message if NO alerts are active */}
                  {!(liveData.drowsy === 'Drowsy' || liveData.load > 0.16 || String(liveData.alcohol).toUpperCase() !== 'SAFE') && (
                    <div className="alert-item success">SYSTEM SECURE: All sensors normal.</div>
                  )}
               </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default Dashboard;
