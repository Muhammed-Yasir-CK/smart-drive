import React, { createContext, useState, useContext, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue, set, remove } from 'firebase/database';
import { useAuth } from './AuthContext';

const VehicleContext = createContext();

export const VehicleProvider = ({ children }) => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Scoping vehicles by username in Firebase
      const vehiclesRef = ref(db, `user_vehicles/${user.username}`);
      
      const unsubscribe = onValue(vehiclesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Convert Firebase object to array and include the device_id as "id"
          const vehicleList = Object.keys(data).map(key => ({
            id: key, 
            ...data[key]
          }));
          setVehicles(vehicleList);
          
          // Persistent selection logic
          const savedVehicleId = localStorage.getItem(`selectedVehicleId_${user.username}`);
          if (savedVehicleId) {
            const found = vehicleList.find(v => v.id === savedVehicleId);
            setSelectedVehicle(found || vehicleList[0]);
          } else if (vehicleList.length > 0) {
            setSelectedVehicle(vehicleList[0]);
          }
        } else {
          setVehicles([]);
          setSelectedVehicle(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setVehicles([]);
      setSelectedVehicle(null);
      setLoading(false);
    }
  }, [user]);

  const changeVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    if (vehicle && user) {
      localStorage.setItem(`selectedVehicleId_${user.username}`, vehicle.id);
    }
  };

  const addVehicle = async (vehicleData) => {
    if (!user) return;
    const { device_id, ...rest } = vehicleData;
    await set(ref(db, `user_vehicles/${user.username}/${device_id}`), {
      ...rest,
      device_id: device_id,
      registered_at: new Date().toISOString()
    });
    // Also mirror to global vehicles node for hardware access if needed
    await set(ref(db, `vehicles/${device_id}`), {
      ...rest,
      device_id: device_id,
      owner_username: user.username
    });
  };

  const deleteVehicle = async (deviceId) => {
    if (!user) return;
    await remove(ref(db, `user_vehicles/${user.username}/${deviceId}`));
    await remove(ref(db, `vehicles/${deviceId}`));
  };

  return (
    <VehicleContext.Provider value={{ 
      vehicles, 
      selectedVehicle, 
      changeVehicle, 
      loading, 
      addVehicle, 
      deleteVehicle 
    }}>
      {children}
    </VehicleContext.Provider>
  );
};

export const useVehicles = () => useContext(VehicleContext);
