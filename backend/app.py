import os

# [STRICT OVERRIDE: Prevent OpenCV OpenCL Driver Crashes on Windows]
os.environ["OPENCV_OPENCL_DEVICE"] = "disabled"
os.environ["OPENCV_VIDEOIO_PRIORITY_MSMF"] = "0" # Fixes slow camera start on windows

import cv2
cv2.ocl.setUseOpenCL(False)

from flask import Flask, request, jsonify, session, Response
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, emit
from models import db, User, Admin, Vehicle, Violation, Camera, Payment, SupportTicket, Report, OTPStore, ActionLog, bcrypt
import uuid
from datetime import datetime, timedelta
import random
import requests
from dotenv import load_dotenv
import razorpay

# Load environment variables (force override to pick up changes without full restart)
load_dotenv(override=True)

# Initialize Razorpay Client
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_SECRET_KEY = os.getenv("RAZORPAY_SECRET_KEY")

if RAZORPAY_KEY_ID and RAZORPAY_SECRET_KEY:
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_SECRET_KEY))
else:
    razorpay_client = None
    print("[WARNING] Razorpay keys not found in .env. Payment gateway will not work.")

# Initialize
app = Flask(__name__)
app.config['SECRET_KEY'] = 'dev-secret-key-123'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///echallan.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'

# Ensure upload directory exists
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

CORS(app, supports_credentials=True, resources={r"/api/*": {"origins": "*"}}, allow_headers=["Content-Type", "Authorization", "X-User-Id"])
db.init_app(app)
bcrypt.init_app(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Create Database tables
with app.app_context():
    if not os.path.exists('instance'):
        os.makedirs('instance')
    db.create_all()

# ============================
# START BACKGROUND ANPR CONTROLLER
# ============================
from modules.main import MainController
import threading
import time

# Create a master tracker logic controller bound to the backend 
anpr_controller = MainController()
anpr_controller.app = app # give context explicitly

def start_backend_monitoring():
    # Will run indefinitely in background thread updating 'display_frame'
    anpr_controller.start_monitoring()

# Spin up independent vision thread so it never blocks HTTP API
vision_thread = threading.Thread(target=start_backend_monitoring, daemon=True)
vision_thread.start()

# ============================
# API ROUTES
# ============================

@app.route('/')
def home():
    return jsonify({"message": "eChallan API is running", "status": "active"})

@app.route('/api/signal-status', methods=['GET'])
def get_signal_status():
    # Fetch the state from the active ANPR controller's signal reader
    current_state = "GREEN" # default fallback
    if hasattr(anpr_controller, 'signal_reader'):
        current_state = anpr_controller.signal_reader.get_state()
    return jsonify({"signal": current_state})

# --- AUTHENTICATION ---

@app.route('/api/auth/register-user', methods=['POST'])
def register_user():
    data = request.json
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    
    # Check if vehicle exists in our dummy database?
    vehicle = Vehicle.query.filter_by(vehicle_number=data['vehicleNumber'].upper()).first()
    if not vehicle:
        # For Demo/Assignment purposes: Automatically create a mock vehicle if doesn't exist
        mock_vehicle = Vehicle(
            vehicle_number=data['vehicleNumber'].upper(),
            owner_name=f"{data['firstName']} {data['lastName']}",
            vehicle_model="Unknown Model (Auto-registered)",
            vehicle_type="Car",
            contact_number=data['phoneNumber'],
            registration_date=datetime.now().date()
        )
        db.session.add(mock_vehicle)
        db.session.commit()

    email = data['email']
    user = User.query.filter_by(email=email).first()
    
    otp = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    
    # Check if vehicle number already registered
    existing_vehicle_user = User.query.filter_by(vehicle_number=data['vehicleNumber'].upper()).first()
    if existing_vehicle_user:
        if existing_vehicle_user.email_verified:
            return jsonify({"error": "Vehicle already registered."}), 409
        else:
            # Overwrite if unverified
            user = existing_vehicle_user
            user.email = email
            user.otp_code = otp
            user.otp_expiry_time = expires_at
            user.first_name = data['firstName']
            user.last_name = data['lastName']
            user.password = hashed_password
            user.phone_number = data['phoneNumber']
    elif user:
        if user.email_verified:
            return jsonify({"error": "Email already registered"}), 409
        else:
            # User exists but not verified. Update OTP
            user.otp_code = otp
            user.otp_expiry_time = expires_at
            user.first_name = data['firstName']
            user.last_name = data['lastName']
            user.password = hashed_password
            user.phone_number = data['phoneNumber']
            user.vehicle_number = data['vehicleNumber'].upper()
    else:
        new_user = User(
            first_name=data['firstName'],
            last_name=data['lastName'],
            email=email,
            password=hashed_password,
            phone_number=data['phoneNumber'],
            vehicle_number=data['vehicleNumber'].upper(),
            email_verified=False,
            otp_code=otp,
            otp_expiry_time=expires_at
        )
        db.session.add(new_user)
        
    try:
        db.session.commit()
        from services.email_service import send_otp_email
        send_otp_email(email, otp)
        return jsonify({"message": "Registration initiated. Pending OTP verification."}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/auth/verify-registration-otp', methods=['POST'])
def verify_registration_otp():
    data = request.json
    email = data.get('email')
    otp = data.get('otp')
    
    if not email or not otp:
        return jsonify({"error": "Missing email or OTP"}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    if user.email_verified:
        return jsonify({"message": "Registration successful"}), 200
        
    if user.otp_code != otp:
        return jsonify({"error": "Invalid OTP"}), 400
        
    if user.otp_expiry_time and datetime.utcnow() > user.otp_expiry_time:
        return jsonify({"error": "OTP expired. Please register again."}), 400
        
    # Verify successful
    user.email_verified = True
    user.otp_code = None
    user.otp_expiry_time = None
    
    try:
        db.session.commit()
        return jsonify({"message": "Registration successful"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/auth/register-admin', methods=['POST'])
def register_admin():
    data = request.json
    # Validation (In real app, restrict admin creation)
    
    if Admin.query.filter_by(username=data['username']).first():
        return jsonify({"error": "Username already taken"}), 409

    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    
    new_admin = Admin(
        full_name=data['fullName'],
        username=data['username'],
        email=data['email'],
        mobile_number=data.get('phoneNumber'), # Added mobile_number
        password=hashed_password
    )

    try:
        db.session.add(new_admin)
        db.session.commit()
        return jsonify({"message": "Admin registered successfully. Waiting for approval (mock)."}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    identifier = data.get('identifier')
    password = data.get('password')

    # Try Admin Login Step
    admin = Admin.query.filter((Admin.email == identifier) | (Admin.username == identifier)).first()
    if admin and bcrypt.check_password_hash(admin.password, password):
        return jsonify({
            "message": "Login successful",
            "user": {"name": admin.full_name, "role": "admin", "email": admin.email, "id": admin.id},
            "token": "fake-jwt-token-admin" # Mock token for now
        }), 200

    # Try User Login Step (Email or Vehicle Number?) -> Standard is Email/Phone usually
    user = User.query.filter(User.email == identifier).first()
    if user and bcrypt.check_password_hash(user.password, password):
        if not getattr(user, 'email_verified', True):  # Fallback to True if column missing
            return jsonify({"error": "Email not verified. Please verify your email first."}), 403
            
        return jsonify({
            "message": "Login successful",
            "user": {"name": f"{user.first_name} {user.last_name}", "role": "user", "email": user.email, "vehicle": user.vehicle_number, "id": user.id},
            "token": "fake-jwt-token-user"
        }), 200

    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    data = request.json
    email = data.get('email')
    
    if not email:
        return jsonify({"error": "Email address is required"}), 400

    user_found = False
    role = 'user'
    
    # Check if user/admin exists
    if User.query.filter_by(email=email).first():
        user_found = True
    elif Admin.query.filter_by(email=email).first():
        user_found = True
        role = 'admin'

    if not user_found:
        return jsonify({"error": "Email not registered"}), 404

    # Generate OTP
    otp = str(random.randint(100000, 999999)) # 6 digits
    expires_at = datetime.utcnow() + timedelta(minutes=5)

    otp_entry = OTPStore(
        identifier=email,
        role=role,
        otp=otp,
        created_at=datetime.utcnow(),
        expires_at=expires_at
    )
    
    try:
        db.session.add(otp_entry)
        db.session.commit()
        
        from services.email_service import send_otp_email
        send_success = send_otp_email(email, otp)
        
        if send_success:
            return jsonify({"success": True, "message": "OTP sent successfully"}), 200
        else:
            db.session.delete(otp_entry)
            db.session.commit()
            return jsonify({"success": False, "error": "Failed to send OTP. Please try again."}), 500
            
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/auth/verify-otp', methods=['POST'])
def verify_otp():
    data = request.json
    email = data.get('email')
    otp = data.get('otp')

    if not email or not otp:
        return jsonify({"error": "Missing required fields"}), 400

    # Find Latest OTP
    record = OTPStore.query.filter_by(identifier=email).order_by(OTPStore.created_at.desc()).first()

    if not record:
        return jsonify({"error": "Invalid OTP"}), 400
        
    if record.otp != otp:
        return jsonify({"error": "Invalid OTP"}), 400
        
    if datetime.utcnow() > record.expires_at:
        return jsonify({"error": "OTP expired. Please resend OTP."}), 400

    return jsonify({"message": "OTP verified successfully", "role": record.role}), 200

@app.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    otp = data.get('otp')
    
    if not email or not password or not otp:
        return jsonify({"error": "Missing required fields"}), 400

    # Re-verify OTP one more time before update
    record = OTPStore.query.filter_by(identifier=email).order_by(OTPStore.created_at.desc()).first()
    if not record or record.otp != otp:
        return jsonify({"error": "Invalid Session/OTP"}), 400
        
    if datetime.utcnow() > record.expires_at:
        return jsonify({"error": "Session expired"}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    
    try:
        if record.role == 'user':
            user = User.query.filter_by(email=email).first()
            if user:
                user.password = hashed_password
                db.session.delete(record)
                db.session.commit()
                return jsonify({"message": "Password reset successfully"}), 200
        elif record.role == 'admin':
            admin = Admin.query.filter_by(email=email).first()
            if admin:
                admin.password = hashed_password
                db.session.delete(record)
                db.session.commit()
                return jsonify({"message": "Password reset successfully"}), 200
        
        return jsonify({"error": "User not found"}), 404
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# --- CORE FUNCTIONALITY ---

@app.route('/api/upload', methods=['POST'])
def upload_violation():
    # Receive file from Raspberry Pi
    if 'image' not in request.files:
        return jsonify({"error": "No image part"}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # Process save
    filename = f"{uuid.uuid4()}_{file.filename}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    # Create Initial Record
    new_violation = Violation(
        image_path=filepath,
        location="Camera 1 - Main Road", # Mock location for now
        violation_type="Processing...",
        status="pending"
    )
    
    db.session.add(new_violation)
    db.session.commit()

    return jsonify({"message": "File uploaded successfully", "id": new_violation.id}), 201

# --- USER DASHBOARD APIS ---


def get_current_user():
    # In a real app, verify JWT. Here we use mock token + custom header for demo
    auth_header = request.headers.get('Authorization')
    user_id = request.headers.get('X-User-Id')
    
    if not auth_header or 'fake-jwt-token-user' not in auth_header:
        return None
    
    if user_id:
        try:
            return User.query.get(int(user_id))
        except ValueError:
            return None
    return None

@app.route('/api/user/challans', methods=['GET'])
def get_user_challans():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    challans = Violation.query.filter_by(vehicle_number=user.vehicle_number).order_by(Violation.timestamp.desc()).all()
    result = []
    for c in challans:
        result.append({
            "id": c.id,
            "display_id": f"#V-{1000 + c.id}",
            "vehicle_number": c.vehicle_number,
            "type": c.violation_type,
            "timestamp": c.timestamp.strftime("%d %B %Y – %H:%M:%S"),
            "amount": c.fine_amount,
            "status": c.status,
            "location": c.location,
            "image": c.image_path,
            "video": c.video_path,
            "plate_crop": c.cropped_plate_path,
            "report_status": Report.query.filter_by(challan_id=c.id).first().status if Report.query.filter_by(challan_id=c.id).first() else None
        })
    return jsonify(result), 200

@app.route('/api/user/statistics', methods=['GET'])
def get_user_statistics():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    total_violations = Violation.query.filter_by(vehicle_number=user.vehicle_number).count()
    active_challans = Violation.query.filter_by(vehicle_number=user.vehicle_number, status='pending').count()
    paid_challans = Violation.query.filter_by(vehicle_number=user.vehicle_number, status='paid').count()
    
    recent_activity = []
    violations = Violation.query.filter_by(vehicle_number=user.vehicle_number).order_by(Violation.timestamp.desc()).limit(5).all()
    for v in violations:
        recent_activity.append({
            "id": v.id,
            "type": v.violation_type,
            "timestamp": v.timestamp.strftime("%d %B %Y – %H:%M:%S"),
            "amount": v.fine_amount,
            "status": v.status
        })
        
    return jsonify({
        "total": total_violations,
        "active": active_challans,
        "paid": paid_challans,
        "recent_activity": recent_activity
    }), 200

@app.route('/api/user/challan/<int:id>', methods=['GET'])
def get_user_challan_detail(id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    c = Violation.query.get(id)
    if not c:
        return jsonify({"error": "Challan not found"}), 404
        
    if c.vehicle_number != user.vehicle_number:
         return jsonify({"error": "Unauthorized Access to this Challan"}), 403
         
    return jsonify({
        "id": c.id,
        "display_id": f"#V-{1000 + c.id}",
        "vehicle_number": c.vehicle_number,
        "type": c.violation_type,
        "timestamp": c.timestamp.strftime("%d %B %Y – %H:%M:%S"),
        "amount": c.fine_amount,
        "status": c.status,
        "location": c.location,
        "image": c.image_path,
        "video": c.video_path,
        "plate_crop": c.cropped_plate_path,
        "report_status": Report.query.filter_by(challan_id=c.id).first().status if Report.query.filter_by(challan_id=c.id).first() else None,
        "is_reported": True if Report.query.filter_by(challan_id=c.id).first() else False,
        "payment_date": c.payment_date.strftime("%d %B %Y – %H:%M:%S") if c.payment_date else None,
        "lat": 19.0760,
        "lng": 72.8777
    }), 200

@app.route('/api/user/payments', methods=['GET'])
def get_user_payments():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    payments = Payment.query.filter_by(user_id=user.id).order_by(Payment.payment_date.desc()).all()
    result = []
    for p in payments:
        violation = Violation.query.get(p.violation_id)
        result.append({
            "id": p.id,
            "challan_id": p.violation_id,
            "display_challan_id": f"#V-{1000 + p.violation_id}",
            "violation_type": violation.violation_type if violation else "Unknown",
            "date": p.payment_date.strftime("%d %B %Y – %H:%M:%S"),
            "amount": p.amount,
            "status": p.status,
            "transaction_ref": p.transaction_ref
        })
    return jsonify(result), 200

@app.route('/api/user/profile', methods=['GET', 'PUT'])
def user_profile():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    if request.method == 'GET':
        return jsonify({
            "firstName": user.first_name,
            "lastName": user.last_name,
            "email": user.email,
            "phoneNumber": user.phone_number,
            "vehicleNumber": user.vehicle_number
        }), 200
    
    if request.method == 'PUT':
        data = request.json
        user.email = data.get('email', user.email)
        user.phone_number = data.get('phoneNumber', user.phone_number)
        try:
            db.session.commit()
            return jsonify({"message": "Profile updated successfully"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500

@app.route('/api/user/support', methods=['GET', 'POST'])
def user_support():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    if request.method == 'GET':
        tickets = SupportTicket.query.filter_by(user_id=user.id).order_by(SupportTicket.created_at.desc()).all()
        result = []
        for t in tickets:
            result.append({
                "id": t.id,
                "subject": t.subject,
                "description": t.description,
                "status": t.status,
                "date": t.created_at.strftime("%Y-%m-%d"),
                "challan_id": t.violation_id
            })
        return jsonify(result), 200
    
    if request.method == 'POST':
        data = request.json
        new_ticket = SupportTicket(
            user_id=user.id,
            subject=data['subject'],
            description=data['description'],
            violation_id=data.get('challan_id')
        )
        try:
            db.session.add(new_ticket)
            db.session.commit()
            return jsonify({"message": "Support ticket created successfully", "id": new_ticket.id}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500

@app.route('/api/payment/create-order', methods=['POST'])
def create_payment_order():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.json
    challan_id = data.get('challan_id')
    challan = Violation.query.get(challan_id)
    
    if not challan or challan.vehicle_number != user.vehicle_number:
        return jsonify({"error": "Challan not found"}), 404
    
    if challan.status == 'paid':
        return jsonify({"error": "Challan already paid"}), 400
        
    if not razorpay_client:
        return jsonify({"error": "Payment gateway not configured"}), 500
        
    # Amount is in paise
    amount = int(challan.fine_amount * 100)
    
    try:
        order = razorpay_client.order.create({
            "amount": amount,
            "currency": "INR",
            "receipt": f"receipt_v_{challan.id}",
            "payment_capture": 1 # Auto capture
        })
        return jsonify({
            "order_id": order['id'],
            "amount": order['amount'],
            "key": RAZORPAY_KEY_ID
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/payment/verify', methods=['POST'])
def verify_payment():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.json
    payment_id = data.get('razorpay_payment_id')
    order_id = data.get('razorpay_order_id')
    signature = data.get('razorpay_signature')
    challan_id = data.get('challan_id')
    
    if not razorpay_client:
        return jsonify({"error": "Payment gateway not configured"}), 500
        
    try:
        # Verify the signature
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': signature
        })
        
        # Payment is authentic
        challan = Violation.query.get(challan_id)
        if not challan:
            return jsonify({"error": "Challan not found"}), 404
            
        challan.status = 'paid'
        challan.payment_status = 'PAID'
        challan.payment_date = datetime.utcnow()
        challan.transaction_id = payment_id
        
        new_payment = Payment(
            user_id=user.id,
            violation_id=challan.id,
            amount=challan.fine_amount,
            transaction_ref=payment_id
        )
        
        db.session.add(new_payment)
        db.session.commit()
        return jsonify({"message": "Payment successful"}), 200
        
    except razorpay.errors.SignatureVerificationError:
        return jsonify({"error": "Payment verification failed"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/user/reports', methods=['POST'])
def create_report():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.json
    challan_id = data.get('challan_id')
    description = data.get('description')
    
    if not challan_id or not description:
        return jsonify({"error": "Missing Required Fields"}), 400
        
    existing = Report.query.filter_by(challan_id=challan_id).first()
    if existing:
         return jsonify({"error": "A report already exists for this challan"}), 400

    new_report = Report(
        user_id=user.id,
        challan_id=challan_id,
        description=description
    )
    
    try:
        db.session.add(new_report)
        db.session.commit()
        return jsonify({"message": "Report submitted successfully", "id": new_report.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# --- ADMIN DASHBOARD APIS ---

def is_admin():
    auth_header = request.headers.get('Authorization')
    return auth_header and 'fake-jwt-token-admin' in auth_header

@app.route('/api/admin/challans', methods=['GET'])
def admin_get_challans():
    if not is_admin():
        return jsonify({"error": "Unauthorized"}), 401
    
    violations = Violation.query.order_by(Violation.timestamp.desc()).all()
    result = []
    for v in violations:
        # Try to find owner name from Vehicle table
        vehicle = Vehicle.query.get(v.vehicle_number) if v.vehicle_number else None
        result.append({
            "id": v.id,
            "display_id": f"#V-{1000 + v.id}",
            "vehicle_number": v.vehicle_number or "Scanning...",
            "owner_name": vehicle.owner_name if vehicle else "Unknown",
            "type": v.violation_type,
            "amount": v.fine_amount,
            "status": v.status,
            "timestamp": v.timestamp.strftime("%d %B %Y – %H:%M:%S"),
            "is_reported": True if Report.query.filter_by(challan_id=v.id).first() else False
        })
    return jsonify(result), 200

@app.route('/api/admin/challan/<int:id>', methods=['GET'])
def admin_get_challan_detail(id):
    if not is_admin():
        return jsonify({"error": "Unauthorized"}), 401
    
    v = Violation.query.get(id)
    if not v:
        return jsonify({"error": "Challan not found"}), 404
    
    vehicle = Vehicle.query.get(v.vehicle_number) if v.vehicle_number else None
    
    return jsonify({
        "id": v.id,
        "display_id": f"#V-{1000 + v.id}",
        "vehicle_number": v.vehicle_number,
        "owner_name": vehicle.owner_name if vehicle else "Unknown",
        "type": v.violation_type,
        "amount": v.fine_amount,
        "status": v.status,
        "timestamp": v.timestamp.strftime("%d %B %Y – %H:%M:%S"),
        "location": v.location,
        "image": v.image_path,
        "video": v.video_path,
        "plate_crop": v.cropped_plate_path,
        "payment_date": v.payment_date.strftime("%d %B %Y – %H:%M:%S") if v.payment_date else None,
        "transaction_id": v.transaction_id,
        "lat": 19.0222,
        "lng": 72.8715
    }), 200

@app.route('/api/admin/statistics', methods=['GET'])
def get_admin_stats():
    if not is_admin():
        return jsonify({"error": "Unauthorized"}), 401
    
    total_violations = Violation.query.count()
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_violations = Violation.query.filter(Violation.timestamp >= today_start).count()
    paid_challans = Violation.query.filter_by(status='paid').count()
    unpaid_challans = Violation.query.filter_by(status='pending').count()
    pending_reports = Report.query.filter_by(status='pending').count()
    active_cameras = Camera.query.filter_by(status='active').count()
    
    # Recent violations for dashboard
    recent_violations = Violation.query.order_by(Violation.timestamp.desc()).limit(5).all()
    recent_list = []
    for rv in recent_violations:
        recent_list.append({
            "id": rv.id,
            "display_id": f"#V-{1000 + rv.id}",
            "vehicle_number": rv.vehicle_number,
            "type": rv.violation_type,
            "timestamp": rv.timestamp.strftime("%d %B %Y – %H:%M:%S"),
            "status": rv.status
        })

    # Simple chart data: Violations in last 7 days
    from sqlalchemy import func
    from datetime import timedelta
    chart_data = []
    for i in range(6, -1, -1):
        day = (datetime.now() - timedelta(days=i)).date()
        count = Violation.query.filter(func.date(Violation.timestamp) == day).count()
        chart_data.append({"date": day.strftime("%b %d"), "count": count})
        
    vehicle_types = db.session.query(Vehicle.vehicle_type, func.count(Violation.id)).join(Violation, Violation.vehicle_number == Vehicle.vehicle_number).group_by(Vehicle.vehicle_type).all()
    type_stats = [{"type": t, "count": c} for t, c in vehicle_types]
    
    if not chart_data or total_violations == 0:
        return jsonify({
            "total": total_violations,
            "today": today_violations,
            "paid": paid_challans,
            "unpaid": unpaid_challans,
            "pending_reports": pending_reports,
            "active_cameras": active_cameras,
            "recent_violations": recent_list,
            "daily_violations": [],
            "vehicle_type_stats": [],
            "message": "No sufficient data available for statistics."
        }), 200

    return jsonify({
        "total": total_violations,
        "today": today_violations,
        "paid": paid_challans,
        "unpaid": unpaid_challans,
        "pending_reports": pending_reports,
        "active_cameras": active_cameras,
        "recent_violations": recent_list,
        "daily_violations": chart_data,
        "vehicle_type_stats": type_stats
    }), 200

@app.route('/api/admin/cameras', methods=['GET'])
def admin_get_cameras():
    if not is_admin():
        return jsonify({"error": "Unauthorized"}), 401
    
    cameras = Camera.query.all()
    # If no cameras exist, seed some for demo
    if not cameras:
        cam1 = Camera(location="Sector 1, Main Crossroad", status="active")
        cam2 = Camera(location="North Entry Point", status="active")
        cam3 = Camera(location="Highway Exit B", status="offline")
        cam4 = Camera(location="Traffic Square A", status="active")
        db.session.add_all([cam1, cam2, cam3, cam4])
        db.session.commit()
        cameras = Camera.query.all()

    result = []
    for c in cameras:
        result.append({
            "id": c.id,
            "location": c.location,
            "status": c.status,
            "last_active": c.last_active.strftime("%Y-%m-%d %H:%M"),
            "ip_address": c.ip_address or f"192.168.1.{100+c.id}"
        })
    return jsonify(result[:6]), 200 # Limited to 6 as requested

# --- LIVE STREAMING ---
def generate_frames():
    """ 
    Stream safely pulls only the shared memory frame 
    calculated by the ANPR Background MainController thread
    """
    while True:
        if anpr_controller.display_frame is not None:
            # Use lock-free frame copying by reading latest processed
            ret, buffer = cv2.imencode('.jpg', anpr_controller.display_frame)
            if ret:
                frame_bytes = buffer.tobytes()
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        # Rate limit stream push to match common framerates (approx 25fps)
        time.sleep(0.04)

@app.route('/api/admin/camera/<int:id>/stream', methods=['GET'])
def get_camera_stream(id):
    # Notice: We are skipping token checks for the actual stream connection for simplicity, 
    # as <img src> in HTML cannot easily pass Authorization headers without URL parameters / tokens.
    
    cam = Camera.query.get(id)
    if not cam:
        return jsonify({"error": "Camera not found"}), 404
        
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/api/admin/reports', methods=['GET'])
def admin_get_reports():
    if not is_admin():
        return jsonify({"error": "Unauthorized"}), 401
    
    reports = Report.query.order_by(Report.created_at.desc()).all()
    result = []
    for r in reports:
        challan = Violation.query.get(r.challan_id)
        user = User.query.get(r.user_id)
        # vehicle = Vehicle.query.get(user.vehicle_number) if user else None
        
        result.append({
            "id": r.id,
            "challan_id": r.challan_id,
            "display_challan_id": f"#V-{1000 + r.challan_id}" if r.challan_id else "Unknown",
            "user_name": f"{user.first_name} {user.last_name}" if user else "Unknown",
            "user_vehicle_number": user.vehicle_number if user else "Unknown",
            "challan_vehicle_number": challan.vehicle_number if challan else "Unknown",
            "owner_name": Vehicle.query.get(challan.vehicle_number).owner_name if challan and Vehicle.query.get(challan.vehicle_number) else "Unknown",
            "violation_type": challan.violation_type if challan else "Unknown",
            "description": r.description,
            "status": r.status,
            "created_at": r.created_at.strftime("%Y-%m-%d"),
            "admin_response": r.admin_response,
            "images": [challan.image_path] if challan else [],
            "plate_crop": challan.cropped_plate_path if challan else None,
            "video": challan.video_path if challan else None
        })
    return jsonify(result), 200

@app.route('/api/admin/reports/<int:id>', methods=['PUT'])
def admin_update_report(id):
    if not is_admin():
        return jsonify({"error": "Unauthorized"}), 401
    
    report = Report.query.get(id)
    if not report:
        return jsonify({"error": "Report not found"}), 404
    
    data = request.json
    status = data.get('status') # accepted, declined/rejected
    response = data.get('response')
    
    if status == 'accepted':
        report.status = 'REPORT ACCEPTED'
        # Cancel and Delete Challan as requested
        challan = Violation.query.get(report.challan_id)
        if challan:
            # Save log before deletion
            log = ActionLog(
                action="ACCEPT_REPORT_CANCEL_CHALLAN",
                target_type="CHALLAN",
                target_id=str(challan.id),
                details=f"Report accepted for challan {challan.id}. Vehicle: {challan.vehicle_number}. Reason: {report.description}"
            )
            db.session.add(log)
            
            # Delete associated records
            Payment.query.filter_by(violation_id=challan.id).delete()
            # We keep the report but mark it as accepted. 
            
            db.session.delete(challan)
            
    elif status == 'declined' or status == 'rejected':
        report.status = 'REPORT REJECTED'
        log = ActionLog(
            action="REJECT_REPORT",
            target_type="REPORT",
            target_id=str(report.id),
            details=f"Report rejected for challan {report.challan_id}."
        )
        db.session.add(log)
        
    if response:
        report.admin_response = response
        
    try:
        db.session.commit()
        return jsonify({"message": f"Report {status} successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route('/api/admin/challan/<int:id>', methods=['DELETE'])
def admin_delete_challan(id):
    if not is_admin():
        return jsonify({"error": "Unauthorized"}), 401
        
    challan = Violation.query.get(id)
    if not challan:
        return jsonify({"error": "Challan not found"}), 404
        
    try:
        # Optional: Delete associated reports/payments first or rely on cascade if configured (not configured here)
        Report.query.filter_by(challan_id=id).delete()
        Payment.query.filter_by(violation_id=id).delete()
        
        db.session.delete(challan)
        db.session.commit()
        return jsonify({"message": "Challan deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    socketio.run(app, debug=False, port=5000)
