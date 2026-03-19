from models import db, User
from services.email_service import send_challan_notification
from datetime import datetime

class Notifier:
    def __init__(self, app=None):
        """
        Integration point for email gateways to send instant violator alerts.
        """
        self.app = app

    def notify_user(self, owner_name, violation_type, vehicle_number=None, fine_amount=500.0, challan_id=None):
        """
        Instantly alert the detected owner without blocking thread processes.
        """
        if owner_name and owner_name != "Unknown Owner" and vehicle_number:
            # Emit real-time notification via SocketIO
            try:
                from flask_socketio import emit
                from app import socketio
                # Important: must be inside app context or use socketio.emit directly if not in request
                socketio.emit('new_violation', {
                    'vehicle': vehicle_number,
                    'violation': violation_type,
                    'fine': f"₹{fine_amount}",
                    'id': challan_id,
                    'display_id': f"#V-{1000 + challan_id}" if challan_id else None
                }, namespace='/')
                print(f"[LIVE SOCKET] Emitted violation event for {vehicle_number}")
            except Exception as e:
                print(f"[LIVE SOCKET ERROR] Could not emit: {e}")

            print("\n" + "*"*45)
            print(f"[LIVE EMAIL ALERT] Notification initiated.")
            print(f"To Owner: {owner_name} ({vehicle_number})")
            print(f"Message: {violation_type} Violation Recorded.")
            
            if self.app:
                with self.app.app_context():
                    # Attempt to find User link to this vehicle
                    user = User.query.filter_by(vehicle_number=vehicle_number).first()
                    if user and user.email:
                        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                        send_success = send_challan_notification(
                            to_email=user.email,
                            user_name=owner_name,
                            vehicle_number=vehicle_number,
                            violation_type=violation_type,
                            fine_amount=fine_amount,
                            timestamp=timestamp
                        )
                        if send_success:
                            print(f"[LIVE EMAIL ALERT] Sent to {user.email}")
                        else:
                            print(f"[LIVE EMAIL ALERT] Failed to send email to {user.email}")
                    else:
                        print(f"[LIVE EMAIL ALERT] User email not found for vehicle {vehicle_number}")
                        
            print("*"*45 + "\n")
