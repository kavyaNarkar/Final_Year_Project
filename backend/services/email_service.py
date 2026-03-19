import smtplib
import os
from email.message import EmailMessage
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def _send_email_base(to_email, subject, body):
    """
    Base function to handle SMTP connections.
    Fetches latest env vars inside the function to ensure compatibility with load_dotenv().
    """
    server_addr = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
    server_port = int(os.environ.get("SMTP_PORT", 587))
    server_user = os.environ.get("SMTP_USERNAME", "dummy_echallan@gmail.com")
    server_pass = os.environ.get("SMTP_PASSWORD", "dummy_password")
    use_real_smtp = os.environ.get("USE_REAL_SMTP", "false").lower() == "true"
    
    try:
        msg = EmailMessage()
        msg.set_content(body)
        msg['Subject'] = subject
        msg['From'] = server_user
        msg['To'] = to_email
        
        if use_real_smtp and server_user and "dummy" not in server_user:
            print(f"[EMAIL] Attempting real SMTP send to {to_email} via {server_addr}...")
            server = smtplib.SMTP(server_addr, server_port)
            server.starttls()
            server.login(server_user, server_pass)
            server.send_message(msg)
            server.quit()
            print(f"[EMAIL] Successfully sent email to {to_email}")
        else:
            # Development/Testing fallback
            print("\n" + "="*50)
            print(f"--- [MOCK EMAIL] to {to_email} ---")
            print(f"Subject: {subject}")
            print(f"Body snippet:\n{body[:100]}...")
            print("="*50 + "\n")
            print("[HINT] Set USE_REAL_SMTP=true and valid SMTP_* env vars to send real emails.")
        
        return True
    except Exception as e:
        print(f"[ERROR] Email system failure: {e}")
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
