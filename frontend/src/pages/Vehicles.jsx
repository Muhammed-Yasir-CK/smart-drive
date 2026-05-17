import React, { useState } from 'react';
import Layout from '../components/Layout';
import { Plus, Trash2, Cpu, CheckCircle } from 'lucide-react';
import { useVehicles } from '../context/VehicleContext';

const Vehicles = () => {
  const { vehicles, selectedVehicle, changeVehicle, addVehicle, deleteVehicle, loading } = useVehicles();
  const [formData, setFormData] = useState({
    vehicle_name: '',
    driver_name: '',
    device_id: '',
    vehicle_number: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addVehicle(formData);
      setFormData({ vehicle_name: '', driver_name: '', device_id: '', vehicle_number: '' });
    } catch (err) {
      alert('Failed to add vehicle in Firebase.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (e, deviceId) => {
    e.stopPropagation();
    if (deviceId === selectedVehicle?.id) {
       alert("Cannot delete the currently selected vehicle. Please switch to another vehicle first.");
       return;
    }
    if (window.confirm('Are you sure you want to remove this vehicle?')) {
      try {
        await deleteVehicle(deviceId);
      } catch (err) {
        alert('Failed to delete vehicle from Firebase.');
      }
    }
  };

  return (
    <Layout>
      <div className="dashboard-header">
        <h1>Vehicle Management (Firebase)</h1>
        <p>All vehicles are now stored securely and in real-time in the cloud.</p>
      </div>

      <div className="grid-2">
        <div className="premium-card glassmorphism">
          <h2 className="widget-header"><Plus size={20} /> Register New Vehicle</h2>
          <form onSubmit={handleAddVehicle} className="mt-8">
            <div className="form-group">
              <label>Vehicle Name</label>
              <input type="text" placeholder="e.g. Logistics Truck A" value={formData.vehicle_name} onChange={e => setFormData({...formData, vehicle_name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Driver Name</label>
              <input type="text" placeholder="John Doe" value={formData.driver_name} onChange={e => setFormData({...formData, driver_name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Vehicle Number</label>
              <input type="text" placeholder="KL-01-AB-1234" value={formData.vehicle_number} onChange={e => setFormData({...formData, vehicle_number: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>ESP32 Device ID</label>
              <input type="text" placeholder="ESP32_001" value={formData.device_id} onChange={e => setFormData({...formData, device_id: e.target.value})} required />
            </div>
            <button className="btn-primary w-full" disabled={submitting}>
              {submitting ? 'Registering...' : 'Add Vehicle'}
            </button>
          </form>
        </div>

        <div className="premium-card glassmorphism">
          <h2 className="widget-header"><Cpu size={20} /> Cloud Managed Fleet</h2>
          <p className="text-secondary text-sm mt-1">Direct synchronization with hardware</p>
          <div className="vehicle-list mt-8">
            {loading ? (
              <p className="text-secondary">Loading fleet...</p>
            ) : vehicles.length === 0 ? (
              <p className="text-secondary">No vehicles registered cloud-side yet.</p>
            ) : (
              vehicles.map(v => (
                <div 
                  key={v.id} 
                  className={`vehicle-item pointer ${selectedVehicle?.id === v.id ? 'active-border' : ''}`}
                  onClick={() => changeVehicle(v)}
                >
                  <div className="vehicle-info">
                    <h3>{v.vehicle_name} {selectedVehicle?.id === v.id && <CheckCircle size={14} color="var(--success)" style={{ display: 'inline', marginLeft: '5px' }} />}</h3>
                    <p>{v.vehicle_number} • ID: {v.device_id}</p>
                  </div>
                  <button className="delete-btn" onClick={(e) => handleDelete(e, v.id)}>
                    <Trash2 size={20} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Vehicles;
