import math

def get_line_side(px, py, line_p1, line_p2):
    """
    Returns the side of the line a point is on using the cross product.
    Formula: (x2 - x1) * (y - y1) - (y2 - y1) * (x - x1)
    """
    x1, y1 = line_p1
    x2, y2 = line_p2
    return (x2 - x1) * (py - y1) - (y2 - y1) * (px - x1)

class SignalJumpDetector:
    def __init__(self, line_p1=(0, 350), line_p2=(640, 350)):
        # Flexible virtual line defined by two points
        self.line_p1 = line_p1
        self.line_p2 = line_p2
        self.signal_state = 'RED' # Can be interfaced dynamically (RED/YELLOW/GREEN)
        
        # State memory per vehicle to prevent jitter/camera shake violations
        self.tracked_vehicles = {}
        self.next_vehicle_id = 0

    def set_signal_state(self, state):
        self.signal_state = state.upper()

    def check_violation(self, vehicles, current_signal_state):
        """
        ISSUE 3 & 4: Logic to trigger violation only if Vehicle front crosses while Signal is RED.
        ISSUE 5: Includes required debug prints.
        """
        current_tracked = {}
        violation_detected = False
        vehicle_detected = len(vehicles) > 0

        for (x, y, w, h) in vehicles:
            cx = x + w // 2
            cy = y + h // 2
            
            # ISSUE 4: Even a small portion (front edge) triggers violation.
            # Using bottom center of bounding box as the 'front' reference in top-down view.
            front_x = cx
            front_y = y + h
            
            # Tracking logic to avoid double-penalizing the same car
            matched_id = None
            min_dist = 100
            for vid, data in self.tracked_vehicles.items():
                prev_cx, prev_cy, prev_fx, prev_fy, has_violated = data
                dist = math.hypot(cx - prev_cx, cy - prev_cy)
                if dist < min_dist:
                    matched_id = vid
                    min_dist = dist
                    
            if matched_id is not None:
                data = self.tracked_vehicles[matched_id]
                has_violated = data[4]
                curr_side = get_line_side(front_x, front_y, self.line_p1, self.line_p2)
                crossed = (curr_side >= 0)

                # ISSUE 5: Debug Prints
                print("Vehicle detected:", vehicle_detected)
                print("Line crossed:", crossed)
                print("Signal:", current_signal_state)

                # STRICT CONDITIONS: Detect + Crossed + RED
                if crossed and current_signal_state == "RED":
                    if not has_violated:
                        print(f"[VIOLATION] Vehicle #{matched_id} jumped RED signal!")
                        violation_detected = True
                        has_violated = True
                    
                current_tracked[matched_id] = (cx, cy, front_x, front_y, has_violated)
                self.tracked_vehicles.pop(matched_id, None)
            else:
                curr_side = get_line_side(front_x, front_y, self.line_p1, self.line_p2)
                crossed = (curr_side >= 0)
                has_violated = False

                # Check for new vehicle appearing already past the line
                if crossed and current_signal_state == "RED":
                    violation_detected = True
                    has_violated = True
                
                current_tracked[self.next_vehicle_id] = (cx, cy, front_x, front_y, has_violated)
                self.next_vehicle_id = (self.next_vehicle_id + 1) % 10000
                
        self.tracked_vehicles = current_tracked
        return violation_detected
