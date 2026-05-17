from django.db import models
from django.contrib.auth.models import User

class Violation(models.Model):
    VIOLATION_TYPES = [
        ('ALCOHOL', 'Alcohol Detected'),
        ('DROWSINESS', 'Driver Drowsy'),
        ('OVERLOAD', 'Vehicle Overloaded'),
        ('TEMPERATURE', 'High Temperature'),
    ]
    
    # Linked to the user who owns the account
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="violations")
    # Device ID is now the identifier for the vehicle in Firebase
    device_id = models.CharField(max_length=100, help_text="ESP32 ID from Firebase")
    
    violation_type = models.CharField(max_length=20, choices=VIOLATION_TYPES)
    # Using JSONField to store the full sensor snapshot at the time of violation
    snapshot_data = models.JSONField(help_text="Full sensor readings at the time of incident")
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.violation_type} - Device: {self.device_id} at {self.timestamp}"
