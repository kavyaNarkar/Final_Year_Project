import cv2

class VehicleDetector:
    def __init__(self, min_area=5000):
        # MOG2 Background subtraction for robust motion tracking
        self.back_sub = cv2.createBackgroundSubtractorMOG2(history=50, varThreshold=50, detectShadows=False)
        self.min_area = min_area

    def detect(self, frame):
        """
        Detect vehicles utilizing minimal CPU footprint via background subtraction
        Returns a list of [x, y, w, h] dictionaries forming bounding boxes.
        """
        fg_mask = self.back_sub.apply(frame)
        contours, _ = cv2.findContours(fg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        detected_vehicles = []
        for c in contours:
            if cv2.contourArea(c) > self.min_area:
                x, y, w, h = cv2.boundingRect(c)
                detected_vehicles.append((x, y, w, h))
                
        return detected_vehicles
