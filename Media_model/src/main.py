



import cv2
import numpy as np
import tensorflow as tf
from threading import Thread
import winsound
import time
import requests
import json
import serial
from urllib.parse import quote

# Local imports
from mediapipe_utils import get_landmarks
from utils import compute_EAR, compute_MAR

# ---------------- CONFIGURATION ----------------
DEVICE_ID = "ESP_001"  #  Must match the ID in your web app
DATABASE_URL = 'https://smart-drive-f0123-default-rtdb.firebaseio.com'

# ---------------- ESP CONNECTION ----------------
try:
    ser = serial.Serial('COM3', 115200)   #  change if needed
    time.sleep(2)
except:
    print("Could not connect to Serial. Running in AI-only mode.")
    ser = None

esp_running = False # Initial state is STOPPED
drowsy_sent = False
last_firebase_update = 0

# Shared state for sensors
sensor_data = {
    "temperature": 0.0,
    "weight": 0.0,
    "alcohol_status": "SAFE",
    "system_active": True,
    "alert": False
}

def firebase_worker(data):
    try:
        encoded_id = quote(DEVICE_ID)
        url = f"{DATABASE_URL}/sensor_data/{encoded_id}.json"
        requests.patch(url, data=json.dumps(data))
    except:
        pass

def send_to_firebase(status):
    global last_firebase_update
    now = time.time()
    
    # Push every 2 seconds or instantly if DROWSY or STOPPED
    if now - last_firebase_update < 2 and status not in ["DROWSY", "SYSTEM_OFFLINE"]:
        return
        
    # Safety check: If system is stopped, don't allow any "AWAKE" updates to sneak through
    if not esp_running and status != "SYSTEM_OFFLINE":
        return

    try:
        is_critical = (
            status == "DROWSY" or 
            sensor_data["temperature"] > 40 or 
            sensor_data["weight"] > 0.16 or 
            sensor_data["alcohol_status"] != "SAFE"
        )
        
        data = {
            "status": status,
            "temperature": float(sensor_data["temperature"]),
            "weight": float(sensor_data["weight"]),
            "alcohol_status": sensor_data["alcohol_status"],
            "system_active": (status != "SYSTEM_OFFLINE"),
            "alert": is_critical,
            "timestamp": int(now)
        }
        
        # Start background thread to avoid lag in the camera/processing loop
        Thread(target=firebase_worker, args=(data,), daemon=True).start()
        
        last_firebase_update = now
        if status == "SYSTEM_OFFLINE":
            print(f"[FIREBASE] >>> {status} SENT (Dashboard should be OFF)")
        else:
            print(f"[FIREBASE] Status: {status} | Temp: {data['temperature']} | Weight: {data['weight']}")
            
    except Exception as e:
        print(f"Firebase Trigger Error: {e}")

# ------------------------------------------------

# Load model
model = tf.keras.models.load_model("../models/my_model_1.h5")

IMG_SIZE = 224

# Camera
# cap = cv2.VideoCapture(1, cv2.CAP_DSHOW)
cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)

if not cap.isOpened():
    print("Camera 1 failed, switching to 0")
    cap = cv2.VideoCapture(1)
    
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

# Thresholds
EAR_THRESHOLD = 0.25
MAR_THRESHOLD = 0.8
COUNTER = 0
ALARM_ON = False

# Alarm
def sound_alarm():
    global ALARM_ON
    while ALARM_ON:
        # winsound.Beep(3000, 1000)
        time.sleep(0.1)

# Preprocess eye
def preprocess_eye(eye_img):
    if eye_img.size == 0:
        return None
    eye = cv2.resize(eye_img, (IMG_SIZE, IMG_SIZE))
    eye = np.expand_dims(eye, axis=0) / 255.0
    return eye

# Counters
yawn_counter = 0
yawn_events = 0
head_counter = 0

while True:

    # READ ESP COMMAND & SENSOR DATA
    try:
        if ser and ser.in_waiting:
            msg = ser.readline().decode(errors='ignore').strip()
            if msg:
                if msg == "START":
                    if not esp_running:
                        print("\n>>> SYSTEM ACTIVATED - STARTING DETECTION")
                        esp_running = True
                elif msg == "STOP":
                    if esp_running:
                        print("\n>>> STOP BUTTON PRESSED - Resetting Dashboard...")
                        esp_running = False
                        sensor_data["temperature"] = 0.0
                        sensor_data["weight"] = 0.0
                        sensor_data["alcohol_status"] = "SAFE"
                        
                        # 1. Clear Serial Buffer
                        if ser: ser.reset_input_buffer()
                        
                        # 2. SEND INSTANT SYNC UPDATE (No thread)
                        try:
                            payload = {
                                "status": "SYSTEM_OFFLINE",
                                "temperature": 0.0,
                                "weight": 0.0,
                                "alcohol_status": "SAFE",
                                "system_active": False,
                                "alert": False,
                                "timestamp": int(time.time())
                            }
                            requests.patch(f"{DATABASE_URL}/sensor_data/{DEVICE_ID}.json", json=payload, timeout=5)
                            print("[FIREBASE] >>> SYSTEM_OFFLINE confirmed in Cloud.")
                        except Exception as e:
                            print(f"[FIREBASE] Error sending stop signal: {e}")
                        
                        print(">>> SYSTEM STOPPED SUCCESSFULLY\n")
                
                # Parsing sensor data (Expected format: T:32.5,W:45.0,A:SAFE,LAT:10.123,LNG:76.123)
                if ":" in msg:
                    parts = msg.split(",")
                    for part in parts:
                        if ":" in part:
                            try:
                                key, val = part.split(":")
                                key = key.strip()
                                val = val.strip()
                                if "Temperature" in key: 
                                    sensor_data["temperature"] = float(val)
                                elif "Weight" in key: 
                                    sensor_data["weight"] = float(val)
                                elif "Alcohol" in key or key == "A": 
                                    sensor_data["alcohol_status"] = val
                            except Exception as e: 
                                print(f"Parse error in part {part}: {e}")
    except Exception as e:
            pass

    ret, frame = cap.read()
    if not ret:
        continue

    # 🔥 STOP MODE
    if not esp_running:
        cv2.putText(frame, "SYSTEM STOPPED", (50,50),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0,0,255), 2)
        cv2.imshow("Drowsiness Detection", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
        continue

    landmarks = get_landmarks(frame)

    if landmarks is None:
        cv2.putText(frame, "NO FACE DETECTED", (50,50),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0,0,255), 2)
        cv2.imshow("Drowsiness Detection", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
        continue

    h, w, _ = frame.shape
    points = [(int(l.x * w), int(l.y * h)) for l in landmarks.landmark]

# ---------------- HEAD TRACKING ----------------
    nose = points[1]
    left_face = points[234]
    right_face = points[454]

    face_center_x = (left_face[0] + right_face[0]) // 2
    face_center_y = (left_face[1] + right_face[1]) // 2

    dx = nose[0] - face_center_x
    dy = nose[1] - face_center_y

    HEAD_X_THRESHOLD = 40
    HEAD_Y_THRESHOLD = 40

    head_status = "STRAIGHT"

    if abs(dx) > HEAD_X_THRESHOLD:
        head_status = "TURNED"

    if abs(dy) > HEAD_Y_THRESHOLD:
        head_status = "TILTED"

    cv2.putText(frame, head_status, (10,160),
            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,0),2)

    cv2.line(frame, nose, (face_center_x, face_center_y), (0,255,255), 2)

# ---------------- DRAW FACE ----------------
    for p in points:
        cv2.circle(frame, p, 1, (0, 255, 255), -1)

# ---------------- EYES ----------------
    left_eye_idx = [33, 160, 158, 133, 153, 144]
    right_eye_idx = [362, 385, 387, 263, 373, 380]

    left_eye = [points[i] for i in left_eye_idx]
    right_eye = [points[i] for i in right_eye_idx]

    leftEAR = compute_EAR(left_eye)
    rightEAR = compute_EAR(right_eye)
    ear = (leftEAR + rightEAR) / 2

    for p in left_eye + right_eye:
        cv2.circle(frame, p, 2, (0,255,0), -1)

# ---------------- MOUTH ----------------
    mouth_idx = [13, 14, 78, 308]
    mouth = [points[i] for i in mouth_idx]

    mar = compute_MAR(mouth)

    x_coords = [p[0] for p in mouth]
    y_coords = [p[1] for p in mouth]

    cv2.rectangle(frame,
                  (min(x_coords), min(y_coords)),
                  (max(x_coords), max(y_coords)),
                  (255, 0, 0), 2)

    for p in mouth:
        cv2.circle(frame, p, 2, (255,0,0), -1)

# ---------------- YAWN ----------------
    if mar > 0.8 and mar < 2.0:
        yawning = True
    else:
        yawning = False

    if yawning:
        yawn_counter += 1
    else:
        if yawn_counter > 8:
            yawn_events += 1
        yawn_counter = 0

# ---------------- CNN ----------------
    x1, y1 = np.min(left_eye, axis=0)
    x2, y2 = np.max(left_eye, axis=0)
    left_eye_roi = frame[y1:y2, x1:x2]

    x1, y1 = np.min(right_eye, axis=0)
    x2, y2 = np.max(right_eye, axis=0)
    right_eye_roi = frame[y1:y2, x1:x2]

    model_status = "Unknown"

    left_input = preprocess_eye(left_eye_roi)
    right_input = preprocess_eye(right_eye_roi)

    if left_input is not None and right_input is not None:
        left_pred = model.predict(left_input, verbose=0)
        right_pred = model.predict(right_input, verbose=0)

        if left_pred[0][0] > 0.5 or right_pred[0][0] > 0.5:
            model_status = "Open Eyes"
        else:
            model_status = "Closed Eyes"

# ---------------- FINAL LOGIC ----------------
    status = "AWAKE"

    if ear < EAR_THRESHOLD or model_status == "Closed Eyes":
        COUNTER += 1
    else:
        COUNTER = 0

    if head_status != "STRAIGHT":
        head_counter += 1
    else:
        head_counter = 0

    if COUNTER > 15:
        status = "DROWSY"
    elif yawn_events >= 3:
        status = "DROWSY"
    elif head_counter > 20:
        status = "DROWSY"

# ---------------- ALARM + ESP ----------------
    # if status == "DROWSY":
    #     if not ALARM_ON:
    #         ALARM_ON = True
    #         Thread(target=sound_alarm, daemon=True).start()

    #     if not drowsy_sent:
    #         ser.write(b"DROWSY\n")
    #         print("Sent DROWSY to ESP")
    #         drowsy_sent = True
    # else:
    #     ALARM_ON = False
    #     drowsy_sent = False
    
    # ---------------- ALARM + ESP ----------------
    if status == "DROWSY":

        # alarm only once
        if not ALARM_ON:
            ALARM_ON = True
            Thread(target=sound_alarm, daemon=True).start()

        # send repeatedly (IMPORTANT)
        try:
            ser.write(b"DROWSY\n")
            ser.flush()
        except:
            pass

    else:
        ALARM_ON = False

        # tell ESP back to normal
        try:
            ser.write(b"SAFE\n")
            ser.flush()
        except:
            pass

# ---------------- DISPLAY ----------------
    cv2.putText(frame, f"EAR: {ear:.2f}", (10,30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255),2)

    cv2.putText(frame, f"MAR: {mar:.2f}", (10,60),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255),2)

    cv2.putText(frame, model_status, (10,90),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,255,0),2)

    cv2.putText(frame, status, (10,130),
                cv2.FONT_HERSHEY_SIMPLEX, 1,
                (0,0,255) if status=="DROWSY" else (0,255,0),2)

    # ---------------- FIREBASE PUSH ----------------
    send_to_firebase(status)

    cv2.imshow("Drowsiness Detection", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()