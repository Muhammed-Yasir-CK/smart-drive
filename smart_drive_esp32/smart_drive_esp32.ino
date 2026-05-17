#include "HX711.h"
#include "DHT.h"
#include <LiquidCrystal.h>

// LCD (RS, E, D4, D5, D6, D7)
LiquidCrystal lcd(23, 22, 21, 32, 13, 2);

// LOAD CELL
#define DT 4
#define SCK 5
HX711 scale;
float calibration_factor = 16000;

bool buzzerState = false;
unsigned long lastBuzzerTime = 0;
bool overloadDetected = false;
// DHT
#define DHTPIN 14
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// MOTOR + CONTROL
int IN1 = 18;
int IN2 = 19;
int relayPin = 26;
int buttonPin = 25;
int mq3Pin = 27;
int buzzer = 33;

bool systemON = false;
bool lastButtonState = HIGH;

unsigned long lastReadTime = 0;

// Threshold
float weightThreshold = 0.1;

// 🔥 DROWSY FLAG
bool drowsyDetected = false;

void setup() {
  Serial.begin(115200);

  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(relayPin, OUTPUT);
  pinMode(buttonPin, INPUT_PULLUP);
  pinMode(mq3Pin, INPUT);
  pinMode(buzzer, OUTPUT);

  digitalWrite(buzzer, LOW);

  dht.begin();

  scale.begin(DT, SCK);
  Serial.println("Calibrating...");
  delay(3000);
  scale.set_scale(calibration_factor);
  scale.tare();

  digitalWrite(relayPin, LOW);

  lcd.begin(16, 2);
  lcd.setCursor(0, 0);
  lcd.print("System Ready");
  delay(2000);
  lcd.clear();
}

void loop() {

  // 🔥 LISTEN FROM PYTHON (DROWSY)
  /*
  if (Serial.available()) {
    String msg = Serial.readStringUntil('\n');
    msg.trim();

    if (msg == "DROWSY") {
      Serial.println("Drowsiness Detected!");

      drowsyDetected = true;

      // STOP MOTOR
      
      // digitalWrite(relayPin, LOW);
      // digitalWrite(IN1, LOW);
      // digitalWrite(IN2, LOW);

      // BUZZER ON
      // 🔊 INTERVAL BUZZER
      for (int i = 0; i < 2; i++) {
        digitalWrite(buzzer, HIGH);
        delay(300);
        digitalWrite(buzzer, LOW);
        delay(300);
      }
      delay(2000);

      // LCD ALERT
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("DROWSY ALERT!");
      lcd.setCursor(0, 1);
      lcd.print("Driver Sleepy");
    }
  }
  */
  
  if (Serial.available()) {
      String msg = Serial.readStringUntil('\n');
      msg.trim();

      if (msg == "DROWSY") {
          drowsyDetected = true;
      }

      if (msg == "SAFE") {
          drowsyDetected = false;
          digitalWrite(buzzer, LOW);
      }


      // LCD ALERT
      // lcd.clear();
      // lcd.setCursor(0, 0);
      // lcd.print("DROWSY ALERT!");
      // lcd.setCursor(0, 1);
      // lcd.print("Driver Sleepy");
  }

  bool currentButton = digitalRead(buttonPin);

  // BUTTON TOGGLE
  if (lastButtonState == HIGH && currentButton == LOW) {
    delay(200);

    if (!systemON) {
      Serial.println("Checking for alcohol...");

      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Checking...");

      int alcohol = digitalRead(mq3Pin);

      if (alcohol == HIGH) {
        Serial.println("START");   // already correct
        systemON = true;

        drowsyDetected = false; // 🔥 reset

        digitalWrite(buzzer, LOW);

        digitalWrite(relayPin, HIGH);
        delay(500);
        digitalWrite(IN1, HIGH);
        digitalWrite(IN2, LOW);

        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("System Started");

      } else {
        Serial.println("System Cannot Start");

        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("Alcohol Found");
        lcd.setCursor(0, 1);
        lcd.print("Cannot Start");

        digitalWrite(buzzer, HIGH);
        delay(2000);
        digitalWrite(buzzer, LOW);
      }

    } else {
      Serial.println("STOP");   // already correct

      systemON = false;
      drowsyDetected = false;   // 🔥 reset

      digitalWrite(relayPin, LOW);
      digitalWrite(IN1, LOW);
      digitalWrite(IN2, LOW);
      digitalWrite(buzzer, LOW);

      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("System Stopped");
    }
  }

  lastButtonState = currentButton;

  // 🔥 IF DROWSY → STOP NORMAL DISPLAY
  /*
  if (drowsyDetected) {
    return;
  }
  if (drowsyDetected) {

      if (millis() - lastBuzzerTime > 300) {
          lastBuzzerTime = millis();
          buzzerState = !buzzerState;
          digitalWrite(buzzer, buzzerState);
      }

  } else {
      digitalWrite(buzzer, LOW);
  }
  */

  if (drowsyDetected || overloadDetected) {

      // Faster beep for drowsy, slower for overload
      int interval = drowsyDetected ? 300 : 600;

      if (millis() - lastBuzzerTime > interval) {
          lastBuzzerTime = millis();
          buzzerState = !buzzerState;
          digitalWrite(buzzer, buzzerState);
      }

  } else {
      digitalWrite(buzzer, LOW);
  }

  // SENSOR DATA
  if (systemON && millis() - lastReadTime > 1000) {
    lastReadTime = millis();

    float temp = dht.readTemperature();

    float weight = scale.get_units(10);
    if (weight < 0.05 && weight > -0.05) {
      weight = 0;
    }
    weight = weight * 0.039;

    Serial.println("----- DATA -----");
    Serial.print("Temperature: ");
    Serial.println(temp);
    Serial.print("Weight: ");
    Serial.println(weight);

    lcd.clear();

    lcd.setCursor(0, 0);
    lcd.print("T:");
    lcd.print(temp);
    lcd.print(" W:");
    lcd.print(weight);

    lcd.setCursor(0, 1);

    /*
    if (weight > weightThreshold) {
      Serial.println("OVERLOAD!");
      // lcd.print("OVERLOAD!");
      digitalWrite(buzzer, HIGH);
    } else {
      // lcd.print("Running...");
      digitalWrite(buzzer, LOW);
    }
    */
    if (weight > weightThreshold) {

        overloadDetected = true;
    } else {
        overloadDetected = false;
    }

    Serial.println("----------------");
  }
}
