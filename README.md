# Smart Drive

Smart Drive is an IoT-based smart vehicle monitoring and tracking system. It integrates hardware sensors, an ESP32 microcontroller, a React frontend, and a Django backend.

## Features

- **Alcohol Detection:** Prevents the vehicle from starting if alcohol is detected using the MQ3 sensor.
- **Drowsiness Detection:** Monitors the driver for drowsiness and alerts with a buzzer.
- **Overload Detection:** Utilizes an HX711 load cell to ensure the vehicle is not overloaded.
- **Temperature Monitoring:** Monitors the environment using a DHT11 sensor.
- **Real-time Tracking:** Frontend dashboard built with React for tracking and monitoring.
- **Secure Backend:** Django REST API with JWT authentication for data management.

## Project Structure

- `backend/` - Django REST framework backend.
- `frontend/` - React application built with Vite.
- `smart_drive_esp32/` - Arduino code for the ESP32 microcontroller.

## Setup Instructions

1. **Backend:** Navigate to `backend/`, install requirements, setup `.env`, and run the Django server.
2. **Frontend:** Navigate to `frontend/`, run `npm install`, setup `.env`, and run the development server (`npm run dev`).
3. **Hardware:** Flash the code from `smart_drive_esp32/` onto your ESP32 using the Arduino IDE.
