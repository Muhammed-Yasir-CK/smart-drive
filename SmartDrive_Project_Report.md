# Smart Drive System - Project Documentation

## 🛰️ 1. ESP32 Pin Diagram
The diagram below shows the wiring for all sensors and actuators.
(Image: esp32_pin_diagram.png)

## 🔌 2. Full Wiring Table

| Component | Pin Function | ESP32 Pin | Logic |
| :--- | :--- | :--- | :--- |
| **LCD 16x2** | Data/Control | **23, 22, 21, 32, 13, 2** | Parallel Mode |
| **HX711** | Load Cell | **DT: 4, SCK: 5** | Weighing |
| **DHT11** | Temperature | **14** | Ambient Temp |
| **MQ3** | Alcohol | **27** | Safety Check |
| **Buzzer** | Warning | **33** | Alerts |
| **Push Button** | System Toggle | **25** | Toggle Start/Stop |
| **Relay** | Power Switch | **26** | Motor Cutoff |
| **L298N** | Motor Drive | **18, 19** | Direction |

## ⚙️ 3. Software Configuration
*   **Firebase Database**: `https://smart-drive-f0123-default-rtdb.firebaseio.com`
*   **Hardware ID**: `ESP_001`
*   **Overload Limit**: `0.16 kg`
*   **Temp Limit**: `40 °C`

## 🏁 4. Execution Steps
1. Run Backend: `python manage.py runserver`
2. Run Dashboard: `npm run dev`
3. Run AI Script: `python main.py` (in Media_model/src)
4. Click the Physical Button on your ESP32 to start monitoring.

---
*Generated for Smart Drive Integration - 2026*
