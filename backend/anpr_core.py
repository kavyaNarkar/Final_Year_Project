import cv2
import easyocr
import numpy as np
import os
import time
import re

class ANPRModule:
    """
    Automatic Number Plate Recognition (ANPR) Module.
    Designed for Indian Number Plates using OpenCV and EasyOCR.
    """
    def __init__(self, stream_url=0):
        """
        :param stream_url: IP Camera URL (e.g., 'http://10.158.157.64:4747/video') or 0 for local webcam.
        """
        self.stream_url = stream_url
        # Initialize EasyOCR reader for English
        # gpu=False ensures it runs on CPU as per common backend requirements
        self.reader = easyocr.Reader(['en'], gpu=False) 
        
        # Load the pre-trained Haar Cascade for license plates
        self.cascade_path = 'haarcascade_plate.xml'
        if not os.path.exists(self.cascade_path):
            print(f"[ERROR] Haar Cascade file not found at {self.cascade_path}")
            self.plate_cascade = None
        else:
            self.plate_cascade = cv2.CascadeClassifier(self.cascade_path)
        
    def connect_camera(self):
        """
        Connects to the stream and returns the VideoCapture object.
        """
        print(f"[PROCESS] Connecting to IP Camera: {self.stream_url}")
        cap = cv2.VideoCapture(self.stream_url)
        
        # Give some time for reconnection
        if not cap.isOpened():
            time.sleep(2)
            cap = cv2.VideoCapture(self.stream_url)
            
        if not cap.isOpened():
            print("[CRITICAL] Failed to establish connection with IP Camera.")
            return None
            
        print("[SUCCESS] Connection established.")
        return cap

    def capture_snapshot(self, cap, filename="snapshot.jpg"):
        """
        Reads one frame from the stream and saves it as an image.
        """
        # Flush buffer to get the freshest frame
        for _ in range(5): cap.grab()
        
        ret, frame = cap.read()
        if ret:
            cv2.imwrite(filename, frame)
            print(f"[FILE] Snapshot captured and saved: {filename}")
            return frame
        else:
            print("[ERROR] Stream error: Could not read frame from camera.")
            return None

    def record_video(self, cap, output_file="violation_10sec.mp4", duration=10):
        """
        Records a video clip of fixed duration.
        """
        print(f"[PROCESS] Initializing 10-second recording...")
        
        frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = 20.0 # Standard for many IP cams; adjust if needed
        
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_file, fourcc, fps, (frame_width, frame_height))

        start_time = time.time()
        frames_captured = 0
        while (time.time() - start_time) < duration:
            ret, frame = cap.read()
            if ret:
                out.write(frame)
                frames_captured += 1
            else:
                break
        
        out.release()
        print(f"[FILE] Evidence video saved: {output_file} ({frames_captured} frames captured)")

    def detect_plate(self, frame):
        """
        Detects plate region using classical Haar Cascade approach.
        """
        if self.plate_cascade is None:
            return None

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Parameters tuned for Indian plates (scaleFactor, minNeighbors)
        plates = self.plate_cascade.detectMultiScale(gray, scaleFactor=1.2, minNeighbors=5, minSize=(30, 30))
        
        if len(plates) > 0:
            # Sort by area and pick largest detection
            (x, y, w, h) = sorted(plates, key=lambda b: b[2] * b[3], reverse=True)[0]
            
            # Crop with safe margins
            plate_crop = frame[max(0, y-10):min(frame.shape[0], y+h+10), 
                               max(0, x-10):min(frame.shape[1], x+w+10)]
                               
            cv2.imwrite("cropped_plate.jpg", plate_crop)
            print("[ANALYTICS] License plate region localized.")
            return plate_crop
        
        return None

    def read_plate_text(self, plate_image):
        """
        Performs OCR on the cropped plate and filters for Indian Number Formats.
        """
        if plate_image is None:
            return "NO_PLATE_IMG"
            
        print("[OCR] Reading characters from localized region...")
        results = self.reader.readtext(plate_image)
        
        detected_texts = []
        for (_, text, _) in results:
            # Cleaning text to keep only Alphanumeric (common in Indian plates)
            clean = re.sub(r'[^A-Z0-9]', '', text.upper())
            if len(clean) >= 4:
                detected_texts.append(clean)
        
        if detected_texts:
            # Join fragments or pick best match
            final_plate = "".join(detected_texts)
            # Basic Indian plate validation (at least 7 chars usually)
            print("\n" + "="*40)
            print("         LICENSE PLATE DETECTED         ")
            print("="*40)
            print(f" TEXT DETECTED: {final_plate}")
            print("="*40 + "\n")
            return final_plate
        else:
            print("[ERROR] Could not read plate text. OCR returned no valid strings.")
            return None

def run_demo():
    """
    Main execution flow for standalone demonstration.
    """
    # Replace URL with your Mobile IP Camera address
    # Example: CAMERA_URL = "http://10.158.157.64:4747/video"
    CAMERA_URL = 0# Defaults to 0 for system testing with webcam
    
    anpr = ANPRModule(stream_url=CAMERA_URL)
    
    cap = anpr.connect_camera()
    if not cap:
        return

    try:
        # Step 1: Capture Snapshot
        snapshot = anpr.capture_snapshot(cap)
        
        # Step 2: LOCALIZATION (Detection)
        if snapshot is not None:
            cropped = anpr.detect_plate(snapshot)
            
            # Step 3: OCR (Reading)
            if cropped is not None:
                anpr.read_plate_text(cropped)
            else:
                print("[!] Local plate detection failed. Attempting OCR on full snapshot.")
                anpr.read_plate_text(snapshot)

        # Step 4: Evidence Recording
        anpr.record_video(cap)
        
    except KeyboardInterrupt:
        print("\n[INFO] Session terminated by user.")
    finally:
        cap.release()
        print("[INFO] Camera resources released.")

if __name__ == "__main__":
    run_demo()
