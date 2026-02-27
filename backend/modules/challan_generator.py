from models import db, Vehicle, Violation

class ChallanGenerator:
    def __init__(self, app):
        """
        Receives app context locally to enforce proper SQLAlchemy threading bounds 
        instead of polluting global scopes.
        """
        self.app = app

    def generate(self, plate_number, violation_type, location, video_path, image_path, plate_path):
        """
        Securely handles Database transaction parsing
        """
        with self.app.app_context():
            owner_name = "Unknown Owner"
            vehicle_model = "Unknown Model"
            
            is_valid_plate = (plate_number and plate_number != "UNKNOWN")
            
            if is_valid_plate:
                vehicle = Vehicle.query.filter_by(vehicle_number=plate_number).first()
                if vehicle:
                    owner_name = vehicle.owner_name
                    vehicle_model = vehicle.vehicle_model
            
            new_violation = Violation(
                vehicle_number=plate_number if is_valid_plate else None,
                violation_type=violation_type,
                location=location,
                status="pending",
                fine_amount=500.0,
                image_path=image_path,
                video_path=video_path,
                cropped_plate_path=plate_path,
                confidence_score=0.98 if is_valid_plate else 0.50
            )
            
            try:
                db.session.add(new_violation)
                db.session.commit()
                return new_violation.id, owner_name
            except Exception as e:
                db.session.rollback()
                print(f"[ERROR] Database Transaction for Challan failed: {e}")
                return None, None
