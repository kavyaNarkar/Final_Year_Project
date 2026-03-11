import smtplib
import os
from email.message import EmailMessage

# For testing you can use a Dummy configuration or real ones when provided.
SMTP_SERVER = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", 587))
SMTP_USERNAME = os.environ.get("SMTP_USERNAME", "dummy_echallan@gmail.com")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "dummy_password")

def _send_email_base(to_email, subject, body):
    """
    Base function to handle SMPT connections.
    """
    try:
        msg = EmailMessage()
        msg.set_content(body)
        msg['Subject'] = subject
        msg['From'] = SMTP_USERNAME
        msg['To'] = to_email
        
        # NOTE: For assignments/development, we just print the email to console
        # In production with valid creds, uncomment the server lines
        # server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        # server.starttls()
        # server.login(SMTP_USERNAME, SMTP_PASSWORD)
        # server.send_message(msg)
        # server.quit()
        
        print("\n" + "="*50)
        print(f"--- EMAIL SENT to {to_email} ---")
        print(f"Subject: {subject}")
        print(f"Body:\n{body}")
        print("="*50 + "\n")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to send email to {to_email}: {e}")
        return False

def send_otp_email(to_email, otp_code):
    """
    Sends a 6-digit OTP for Registration or Password Reset.
    """
    subject = "Traffic Sentinel - Your OTP Verification Code"
    body = f"""Hello,

Your One Time Password (OTP) for verification is: {otp_code}

This code will expire in 5 minutes.

If you did not request this, please ignore this email.

Regards,
Traffic Sentinel Team"""

    return _send_email_base(to_email, subject, body)

def send_challan_notification(to_email, user_name, vehicle_number, violation_type, fine_amount, timestamp):
    """
    Sends an email to the vehicle owner when a challan is issued.
    """
    subject = "Traffic Violation Detected – Challan Issued"
    body = f"""Dear {user_name},

A traffic violation has been recorded for your vehicle.

Vehicle Number: {vehicle_number}
Violation: {violation_type}
Fine Amount: ₹{fine_amount}
Date & Time: {timestamp}

Please log in to the Traffic Sentinel system to view the challan and make payment.

Regards,
Traffic Sentinel Enforcement"""
    
    return _send_email_base(to_email, subject, body)
