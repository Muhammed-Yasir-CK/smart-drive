import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Activity, Zap, Thermometer, Weight, Truck } from 'lucide-react';
import { useVehicles } from '../context/VehicleContext';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Monitoring = () => {
  const { selectedVehicle } = useVehicles();
  const [history, setHistory] = useState({ labels: [], temp: [], load: [] });

  useEffect(() => {
    if (selectedVehicle) {
      const sensorRef = ref(db, `sensor_data/${selectedVehicle.device_id}`);
      const unsubscribe = onValue(sensorRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const ts = data.timestamp ? (data.timestamp > 2000000000 ? data.timestamp : data.timestamp * 1000) : Date.now();
          const timeLabel = new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          
          setHistory(prev => {
            const labels = [...prev.labels, timeLabel].slice(-20);
            const temp = [...prev.temp, data.temperature || 0].slice(-20);
            const load = [...prev.load, data.weight || 0].slice(-20);
            return { labels, temp, load };
          });
        }
      });
      return () => unsubscribe();
    }
  }, [selectedVehicle]);

  const tempChartData = {
    labels: history.labels,
    datasets: [{
      label: 'Temperature (°C)',
      data: history.temp,
      borderColor: '#ff4d4d',
      backgroundColor: 'rgba(255, 77, 77, 0.2)',
      tension: 0.4,
      fill: true
    }]
  };

  const loadChartData = {
    labels: history.labels,
    datasets: [{
      label: 'Load Weight (kg)',
      data: history.load,
      borderColor: '#00d2ff',
      backgroundColor: 'rgba(0, 210, 255, 0.5)',
      borderRadius: 5,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#888' } },
      x: { grid: { display: false }, ticks: { color: '#888', display: false } }
    },
    plugins: { legend: { display: false } }
  };

  return (
    <Layout>
      <div className="dashboard-header">
        <h1>Sensor Monitoring</h1>
        <p>In-depth analytics and historical sensor trends {selectedVehicle ? `for ${selectedVehicle.vehicle_name}` : ''}</p>
      </div>

      {!selectedVehicle ? (
        <div className="premium-card glassmorphism text-center py-20">
          <Truck size={48} color="var(--accent-color)" className="mx-auto mb-4" />
          <h2>No Vehicle Selected</h2>
          <p>Please select a vehicle to view monitoring data.</p>
        </div>
      ) : (
        <div className="dashboard-grid">
          <div className="premium-card glassmorphism h-400">
            <div className="widget-header"><Thermometer size={20} /> Temperature Analytics</div>
            <div className="p-4 h-full" style={{ minHeight: '300px' }}>
              <Line data={tempChartData} options={options} />
            </div>
          </div>
          <div className="premium-card glassmorphism h-400">
            <div className="widget-header"><Weight size={20} /> Load Distribution</div>
            <div className="p-4 h-full" style={{ minHeight: '300px' }}>
              <Bar data={loadChartData} options={options} />
            </div>
          </div>
          <div className="premium-card glassmorphism h-400">
            <div className="widget-header"><Zap size={20} /> Motor Performance</div>
            <div className="flex-center h-full text-secondary">
              <p>Analyzing efficiency patterns...</p>
            </div>
          </div>
          <div className="premium-card glassmorphism h-400">
            <div className="widget-header"><Activity size={20} /> System Uptime</div>
            <div className="flex-center h-full text-secondary">
              <p>Calculating reliability scores...</p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Monitoring;
