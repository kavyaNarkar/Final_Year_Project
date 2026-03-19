from models import db, User, create_app_minimal
from collections import defaultdict

def cleanup_duplicates():
    app = create_app_minimal()
    with app.app_context():
        # Keep track of records we've seen
        seen_emails = set()
        seen_vehicles = set()
        
        users = User.query.order_by(User.created_at.desc()).all()
        to_delete = []
        
        for user in users:
            email = user.email.lower()
            vehicle = user.vehicle_number.upper()
            
            if email in seen_emails or vehicle in seen_vehicles:
                to_delete.append(user)
                print(f"Marked duplicate for deletion: ID {user.id}, Email {user.email}, Vehicle {user.vehicle_number}")
            else:
                seen_emails.add(email)
                seen_vehicles.add(vehicle)
        
        if to_delete:
            for user in to_delete:
                db.session.delete(user)
            db.session.commit()
            print(f"Deleted {len(to_delete)} duplicate user(s).")
        else:
            print("No duplicate users found.")

if __name__ == "__main__":
    cleanup_duplicates()
