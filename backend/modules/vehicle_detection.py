import cv2
from ultralytics import YOLO

class VehicleDetector:
    def __init__(self, min_area=5000):
        # MOG2 Background subtraction removed, using YOLOv8 for robust object detection
        self.model = YOLO('yolov8n.pt')
        self.min_area = min_area
        # COCO dataset IDs: 2: car, 3: motorcycle, 5: bus, 7: truck
        self.target_classes = [2, 3, 5, 7]

    def detect(self, frame):
        """
        Detect vehicles utilizing YOLOv8 object detection model.
        Returns a list of [x, y, w, h] dictionaries forming bounding boxes.
        Ignores people, hands, and background motion.
        """
        detected_vehicles = []
        
        # Run inference on the frame for vehicle classes only
        results = self.model(frame, classes=self.target_classes, verbose=False)
        
        for result in results:
            boxes = result.boxes
            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                w = int(x2 - x1)
                h = int(y2 - y1)
                x = int(x1)
                y = int(y1)
                
                if (w * h) > self.min_area:
                    detected_vehicles.append((x, y, w, h))
                    
        return detected_vehicles
