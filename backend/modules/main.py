import sys
import os

# Add the parent 'backend' directory to sys.path to allow importing 'models'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import cv2

# Fix: Disable OpenCL to prevent "Can't create default OpenCL queue" errors
# This forces OpenCV to use pure CPU (or CUDA if compiled), bypassing broken Intel/AMD OpenCL drivers
cv2.ocl.setUseOpenCL(False)

import time
import uuid
import numpy as np
import threading
from collections import deque
from models import create_app

# Importing all robust independent modules seamlessly
from modules.vehicle_detection import VehicleDetector
from modules.signal_jump import SignalJumpDetector
from modules.speed_detection import SpeedDetector
from modules.film_detection import FilmDetector
from modules.anpr import ANPRProcessor
from modules.challan_generator import ChallanGenerator
from modules.notifier import Notifier
from modules.signal_reader import SignalReader

# [GLOBAL CONFIGURATION]
# Set the Camera URL here (0 or 1 for local webcams, or an RTSP/HTTP URL for IP cameras)
CAMERA_URL = 1

class MainController:
    """
    Main Orchestrator File:
    Keeps entire logic runtime continuously active.
    It doesn't 'do' things itself, rather assigns roles gracefully.
    """
    def __init__(self):
        # Media directories
        os.makedirs("uploads/videos", exist_ok=True)
        os.makedirs("uploads/images", exist_ok=True)
        os.makedirs("uploads/plates", exist_ok=True)
        
        # Latest frame buffer for frontend
        self.display_frame = None
        self.stop_requested = False
        
        # Modules Instantiation 
        self.app = create_app()
        self.vehicle_detector = VehicleDetector(min_area=5000)
        
        # [CONFIG: VIRTUAL LINE ADJUSTMENT]
        # Change these points to move or angle the virtual line on the screen
        self.virtual_line_p1 = (20, 350)
        self.virtual_line_p2 = (620, 350)
        self.signal_jump_detector = SignalJumpDetector(line_p1=self.virtual_line_p1, line_p2=self.virtual_line_p2)
        self.signal_reader = SignalReader()
        
        self.anpr_processor = ANPRProcessor()
        self.last_early_capture_time = 0.0
        self.challan_generator = ChallanGenerator(self.app)
        self.notifier = Notifier(self.app)
        
        # Additional Extensibility hooks
        self.speed_detector = SpeedDetector()
        self.film_detector = FilmDetector()

    def process_violation_event(self, frames, fps, width, height, violation_type):
        """
        Event-Triggered processing function detached to a Daemon thread.
        Never breaks continuous Stream flow.
        """
        # Ensure uploads/violations exists
        os.makedirs("uploads/violations", exist_ok=True)
        
        session_id = str(uuid.uuid4())[:8]
        video_path = f"uploads/violations/{session_id}.mp4"
        best_frame_path = f"uploads/violations/{session_id}_vehicle.jpg"
        plate_path = f"uploads/violations/{session_id}_plate.jpg"
        
        # Write Video (Evidence) explicitly
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(video_path, fourcc, fps, (width, height))
        for f in frames:
            out.write(f)
        out.release()
        
        # ANPR Suite processing
        best_frame, plate_crop, detected_plate = self.anpr_processor.process_frames(frames)
        
        if best_frame is not None:
            cv2.imwrite(best_frame_path, best_frame)
            cv2.imwrite(plate_path, plate_crop)
            
            # DB Storage integration
            challan_id, owner_name = self.challan_generator.generate(
                detected_plate, 
                violation_type,
                "Traffic Square A", # Default node locator
                video_path,
                best_frame_path,
                plate_path
            )
            
            if challan_id:
                print(f"[DB] Inserted Challan #{challan_id} successfully.")
                self.notifier.notify_user(owner_name, violation_type, vehicle_number=detected_plate, challan_id=challan_id)
        else:
            print("[WARNING] Could not salvage OCR from video clipping.")

    def start_monitoring(self):
        print(f"[SYSTEM] Connecting to Node '{CAMERA_URL}'...")
        cap = cv2.VideoCapture(CAMERA_URL)
        if not cap.isOpened():
            time.sleep(2)
            cap = cv2.VideoCapture(CAMERA_URL)
            
        if not cap.isOpened():
            print("[CRITICAL] IP Stream offline.")
            return

        fps = cap.get(cv2.CAP_PROP_FPS)
        if not fps or np.isnan(fps): fps = 20.0
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        if width == 0: width, height = 640, 480

        # Memory buffer storing continuous 30 frame slices (few seconds) before triggers
        buffered_frames = deque(maxlen=30)
            
        is_recording = False
        recording_start_time = None
        recorded_frames = []
        frame_count = 0
        
        # Threaded stream reading
        self.stream_ret = False
        self.stream_frame = None
        self.stream_thread_obj = threading.Thread(target=self._update_stream, args=(cap,), daemon=True)
        self.stream_thread_obj.start()
        
        # Wait until first frame is ready
        while not self.stream_ret and not self.stop_requested:
            time.sleep(0.1)
        
        print("\n" + "="*50)
        print("          LIVE MONITORING ACTIVE SERVER   ")
        print(" Press 'q' or 'Ctrl+Q' in window to exit  ")
        print("="*50 + "\n")
        
        try:
            while not self.stop_requested:
                ret, frame = self.stream_ret, self.stream_frame
                if not ret or frame is None:
                    if isinstance(CAMERA_URL, str) and not CAMERA_URL.startswith("http"):
                        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                        continue
                    print("[WARNING] Signal lost, retrying stream...")
                    time.sleep(1)
                    continue
                    
                # Resize frame for better stream/processing performance
                frame = cv2.resize(frame, (width, height))
                frame_count += 1
                
                if is_recording:
                    recorded_frames.append(frame)
                    # Stop active tracking explicitly after 10 full seconds padding
                    if time.time() - recording_start_time >= 10:
                        is_recording = False
                        # Fork completely independent thread so 'While TRUE' loop remains running
                        processing_thread = threading.Thread(
                            target=self.process_violation_event, 
                            args=(list(recorded_frames), fps, width, height, "Signal Jump"),
                            daemon=True
                        )
                        processing_thread.start()
                        recorded_frames.clear()
                        buffered_frames.clear()
                else:
                    buffered_frames.append(frame)
                    
                    # Offload cycles - process rules strictly every 2nd step
                    if frame_count % 2 == 0:
                        vehicles = self.vehicle_detector.detect(frame)
                        
                        if vehicles:
                            # [EARLY VEHICLE & PLATE CAPTURE LOGIC]
                            # Start detecting plate as soon as vehicle is seen, BEFORE violation
                            if time.time() - self.last_early_capture_time > 3:
                                plate_cascade = self.anpr_processor.plate_cascade
                                if plate_cascade is not None:
                                    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                                    plates = plate_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
                                    if len(plates) > 0:
                                        print("[EARLY ANPR] Vehicle detected approaching. Capturing initial plate snapshot...")
                                        early_snap_path = f"uploads/images/early_snap_{uuid.uuid4().hex[:8]}.jpg"
                                        cv2.imwrite(early_snap_path, frame)
                                        self.last_early_capture_time = time.time()
                            
                            current_signal_state = self.signal_reader.get_state()
                            is_signal_jump = self.signal_jump_detector.check_violation(vehicles, current_signal_state)
                            
                            if is_signal_jump:
                                is_recording = True
                                recording_start_time = time.time()
                                recorded_frames = list(buffered_frames) + [frame]
                                
                # ISSUE 2: Overlay signal on stream exactly as requested
                current_signal_state = self.signal_reader.get_state()
                
                # Rendering UI explicitly for Admins observing the node
                display_frame = frame.copy()
                
                # Signal Overlay (ISSUE 2)
                cv2.putText(
                    display_frame,
                    f"Signal: {current_signal_state}",
                    (20, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 
                    1,
                    (0, 255, 0),
                    2
                )
                
                # [VIRTUAL LINE DRAWING (ADMIN VIEW)]
                lp1 = self.signal_jump_detector.line_p1
                lp2 = self.signal_jump_detector.line_p2
                cv2.line(display_frame, lp1, lp2, (0, 255, 255), 2) # Yellow line
                
                # Status & FPS
                cv2.putText(display_frame, f"REC: {'YES' if is_recording else 'NO'}", 
                            (20, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,0,255) if is_recording else (255,255,255), 2)
                cv2.putText(display_frame, f"FPS: {int(fps)}", 
                            (display_frame.shape[1] - 120, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

                # Expose frame to memory for endpoints
                self.display_frame = display_frame.copy()
                
                # Sleep a tiny bit to prevent 100% CPU lock if needed
                time.sleep(0.005)
                
        except Exception as e:
            print(f"\n[SYSTEM] Server interrupted forcefully. {e}")
        finally:
            self.stop_requested = True
            cap.release()
            print("[SYSTEM] Safe Exit complete. Streams offline.")

    def _update_stream(self, cap):
        while not self.stop_requested:
            if cap.isOpened():
                ret, frame = cap.read()
                self.stream_ret = ret
                if ret:
                    self.stream_frame = frame
            time.sleep(0.01)

if __name__ == "__main__":
    controller = MainController()
    # Execute Main Controller stream block
    controller.start_monitoring()
