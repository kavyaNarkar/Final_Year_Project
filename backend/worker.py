import time
import os
import cv2
import easyocr
import imutils
import numpy as np
import re
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Violation, Vehicle, db, create_app # Import app factory

# Function to extract plate text
def extract_plate_text(image_path, reader):
    print(f"Processing: {image_path}")
    img = cv2.imread(image_path)
    if img is None:
        return None, "Image Load Failed"
    
    # 1. Grayscale & Blur
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    bfilter = cv2.bilateralFilter(gray, 11, 17, 17) # Noise reduction
    
    # 2. Edge Detection
    edged = cv2.Canny(bfilter, 30, 200)

    # 3. Find Contours
    keypoints = cv2.findContours(edged.copy(), cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    contours = imutils.grab_contours(keypoints)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:10]
    
    location = None
    for contour in contours:
        approx = cv2.approxPolyDP(contour, 10, True)
        if len(approx) == 4:
            location = approx
            break
            
    # 4. Masking (Optional, for now directly OCR on crop)
    plate_text = ""
    start_time = time.time()
    
    # Fallback: OCR on the whole image if no contour found (or specific region)
    # For better results in this "demo" without a strict model, we try to read the whole image 
    # but EasyOCR is slow on large images. Let's try to detect text.
    
    result = reader.readtext(gray)
    
    detected_text = []
    for (bbox, text, prob) in result:
        # Simple filter for license plate format (e.g., MH12...)
        clean_text = re.sub(r'[^A-Z0-9]', '', text.upper())
        if len(clean_text) > 4:
             detected_text.append(clean_text)
             # Draw box on image (visual proof)
             (top_left, top_right, bottom_right, bottom_left) = bbox
             top_left = tuple(map(int, top_left))
             bottom_right = tuple(map(int, bottom_right))
             cv2.rectangle(img, top_left, bottom_right, (0, 255, 0), 2)
             cv2.putText(img, text, (top_left[0], top_left[1] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

    # Save processed image with boxes
    processed_path = image_path.replace("uploads", "processed_uploads")
    if not os.path.exists(os.path.dirname(processed_path)):
        os.makedirs(os.path.dirname(processed_path))
        
    cv2.imwrite(processed_path, img)
    
    return detected_text, processed_path

def process_violations(app):
    print("Initializing EasyOCR...")
    reader = easyocr.Reader(['en'], gpu=False) # CPU for compatibility
    print("Worker Started. Waiting for violations...")

    while True:
        with app.app_context():
            # Find Pending Violations
            pending = Violation.query.filter(
                (Violation.status == 'pending') | (Violation.violation_type == 'Processing...')
            ).all()

            if not pending:
                time.sleep(2)
                continue

            for violation in pending:
                print(f"Found Violation ID: {violation.id}")
                
                try:
                    # Perform Processing
                    detected_texts, processed_img_path = extract_plate_text(violation.image_path, reader)
                    
                    # Logic to match vehicle
                    matched_vehicle = None
                    final_plate = "UNKNOWN"
                    
                    if detected_texts:
                        for text in detected_texts:
                            # Check database
                            v = Vehicle.query.filter_by(vehicle_number=text).first()
                            if v:
                                matched_vehicle = v
                                final_plate = text
                                break
                        
                        if not matched_vehicle and detected_texts:
                            final_plate = detected_texts[0] # Pick first if no match
                            
                    # Update Record
                    violation.vehicle_number = final_plate
                    # violation.image_path = processed_img_path # Point to processed image? Or keep original? Let's keep original for evidence, maybe store processed separately
                    # For this scope, let's just update status
                    
                    if matched_vehicle:
                        violation.violation_type = "Speeding" # Mock classification
                        violation.fine_amount = 2000.0
                        violation.status = "processed"
                        violation.confidence_score = 0.95
                        print(f"Matched Vehicle: {final_plate}")
                    else:
                        violation.violation_type = "Unidentified"
                        violation.status = "needs_review"
                        violation.fine_amount = 0.0
                        print(f"Could not match vehicle definitively. Read: {final_plate}")

                    db.session.commit()
                    
                except Exception as e:
                    print(f"Error processing {violation.id}: {e}")
                    violation.status = "error"
                    db.session.commit()

        time.sleep(1)

if __name__ == "__main__":
    app = create_app()
    # Ensure processed folder exists
    if not os.path.exists('processed_uploads'):
        os.makedirs('processed_uploads')
        
    process_violations(app)
