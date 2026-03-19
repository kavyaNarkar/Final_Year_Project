from flask import Flask, session
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_cors import CORS
import os
from datetime import datetime

# Initialize extensions
db = SQLAlchemy()
bcrypt = Bcrypt()

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'supersecretsahilkey123'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///echallan.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize with app
    db.init_app(app)
    bcrypt.init_app(app)
    CORS(app, supports_credentials=True)

    with app.app_context():
        db.create_all()

    return app

# ==========================================
# DATABASE MODELS
# ==========================================

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(60), nullable=False)
    phone_number = db.Column(db.String(15), nullable=False)
    vehicle_number = db.Column(db.String(20), db.ForeignKey('vehicle.vehicle_number'), nullable=False, unique=True)
    role = db.Column(db.String(10), default='user')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    email_verified = db.Column(db.Boolean, default=False)
    otp_code = db.Column(db.String(6), nullable=True)
    otp_expiry_time = db.Column(db.DateTime, nullable=True)

class Admin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    mobile_number = db.Column(db.String(15), unique=True, nullable=True) # made nullable to avoid migration crash on existing rows
    password = db.Column(db.String(60), nullable=False)
    role = db.Column(db.String(10), default='admin')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Vehicle(db.Model):
    vehicle_number = db.Column(db.String(20), primary_key=True)
    owner_name = db.Column(db.String(100), nullable=False)
    vehicle_model = db.Column(db.String(100), nullable=False)
    vehicle_type = db.Column(db.String(20), nullable=False) # Car, Bike, Truck
    contact_number = db.Column(db.String(15), nullable=False)
    registration_date = db.Column(db.Date, nullable=False)

class Donation(db.Model): # Placeholder for payment logic if needed later
    id = db.Column(db.Integer, primary_key=True)
    pass

class Violation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    vehicle_number = db.Column(db.String(20), db.ForeignKey('vehicle.vehicle_number'), nullable=True)
    violation_type = db.Column(db.String(50), nullable=False)
    location = db.Column(db.String(100), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='pending') # pending, processed, paid
    fine_amount = db.Column(db.Float, default=0.0)
    image_path = db.Column(db.String(200), nullable=False)
    video_path = db.Column(db.String(200), nullable=True) # 10s video path
    cropped_plate_path = db.Column(db.String(200), nullable=True)
    confidence_score = db.Column(db.Float, default=0.0)
    payment_date = db.Column(db.DateTime, nullable=True)
    transaction_id = db.Column(db.String(100), nullable=True)
    payment_status = db.Column(db.String(20), default='UNPAID')

class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    violation_id = db.Column(db.Integer, db.ForeignKey('violation.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    transaction_ref = db.Column(db.String(100), unique=True, nullable=False)
    payment_date = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='success')

class SupportTicket(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    subject = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    violation_id = db.Column(db.Integer, db.ForeignKey('violation.id'), nullable=True)
    status = db.Column(db.String(20), default='Open') # Open, Resolved
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Camera(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    location = db.Column(db.String(100), nullable=False)
    ip_address = db.Column(db.String(50), nullable=True)
    status = db.Column(db.String(20), default='active')
    last_active = db.Column(db.DateTime, default=datetime.utcnow)

class Report(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    challan_id = db.Column(db.Integer, db.ForeignKey('violation.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    description = db.Column(db.Text, nullable=False)
    admin_response = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='pending') # pending, accepted, declined
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class OTPStore(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    identifier = db.Column(db.String(120), nullable=False) # e.g. email or mobile
    role = db.Column(db.String(10), nullable=False) # user or admin
    otp = db.Column(db.String(6), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)

class ActionLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(db.Integer, db.ForeignKey('admin.id'), nullable=True)
    action = db.Column(db.String(100), nullable=False)
    target_type = db.Column(db.String(50), nullable=True)
    target_id = db.Column(db.String(100), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    details = db.Column(db.Text, nullable=True)

# Helper to create app for migrations/initialization
def create_app_minimal():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///echallan.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    return app
