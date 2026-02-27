import cv2
import easyocr
import numpy as np
import os
import re

class ANPRProcessor:
    def __init__(self):
        # Initialized reader strictly for processing the best isolated frame
        self.reader = easyocr.Reader(['en'], gpu=False)
        self.cascade_path = 'haarcascade_plate.xml'
        
        if os.path.exists(self.cascade_path):
            self.plate_cascade = cv2.CascadeClassifier(self.cascade_path)
        else:
            print("[WARNING] plate cascade file missing, detection might rely entirely on OCR area.")
            self.plate_cascade = None

    def compute_sharpness(self, image):
        """Higher Variance of Laplacian implies higher sharpness."""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        return cv2.Laplacian(gray, cv2.CV_64F).var()

    def select_best_frame_and_plate(self, frames):
        """
        Analyzes a sequence of frames smartly skipping iterations.
        Extracts the highest quality, most legible number plate instance.
        """
        best_frame = None
        best_plate_bbox = None
        best_score = -1
        
        for k, f in enumerate(frames):
            if k % 3 != 0: continue # Smart processing skips frames to optimize CPU
            
            if self.plate_cascade is not None:
                gray = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY)
                plates = self.plate_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
                
                for (px, py, pw, ph) in plates:
                    plate_area = pw * ph
                    plate_crop = f[max(0, py-5):min(f.shape[0], py+ph+5), 
                                   max(0, px-5):min(f.shape[1], px+pw+5)]
                                   
                    if plate_crop.size == 0: continue
                    
                    sharpness = self.compute_sharpness(plate_crop)
                    score = (plate_area * 0.5) + (sharpness * 2.0)
                    
                    if score > best_score:
                        best_score = score
                        best_frame = f.copy()
                        best_plate_bbox = (px, py, pw, ph)

        # Fallback to a middle frame heavily processed if cascade struggled
        if best_frame is None and len(frames) > 0:
            best_frame = frames[len(frames)//2]

        return best_frame, best_plate_bbox

    def enhance_quality(self, image):
        # Convert, Denoise, Increase Contrast
        gray_frame = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        denoised = cv2.bilateralFilter(gray_frame, 11, 17, 17)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        enhanced_gray = clahe.apply(denoised)
        
        # Sharpening Mask
        kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
        enhanced_frame = cv2.filter2D(enhanced_gray, -1, kernel)
        return enhanced_frame

    def extract_text(self, plate_crop):
        results = self.reader.readtext(plate_crop)
        for (_, text, _) in results:
            clean_text = re.sub(r'[^A-Z0-9]', '', text.upper())
            # STRICT Ruleset: MH01AB0001 format ONLY
            pattern = r'[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}'
            match = re.search(pattern, clean_text)
            if match:
                return match.group(0)
        return "UNKNOWN"

    def process_frames(self, frames):
        """
        Orchestrator to perform the complete ANPR suite pipeline.
        Enhances frame, isolates plate crop, and parses via regex.
        """
        best_frame, best_plate_bbox = self.select_best_frame_and_plate(frames)
        if best_frame is None:
            return None, None, "UNKNOWN"

        enhanced_frame = self.enhance_quality(best_frame)
        plate_crop = enhanced_frame
        
        if best_plate_bbox:
            x, y, w, h = best_plate_bbox
            crop_margin = 10
            plate_crop = enhanced_frame[
                max(0, y-crop_margin):min(enhanced_frame.shape[0], y+h+crop_margin), 
                max(0, x-crop_margin):min(enhanced_frame.shape[1], x+w+crop_margin)
            ]

        detected_plate = self.extract_text(plate_crop)
        return best_frame, plate_crop, detected_plate
