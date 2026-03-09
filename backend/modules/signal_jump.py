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

    def check_violation(self, vehicles):
        """
        Logic: Any detected vehicle whose FRONT point crosses the virtual line triggers violation.
        Uses tracking to ensure NO camera shake triggers violation.
        A vehicle MUST geometrically travel from above the line to below the line (forward direction).
        """
        current_tracked = {}
        violation_detected = False
            
        for (x, y, w, h) in vehicles:
            cx = x + w // 2
            cy = y + h // 2
            
            # Use the front-most point of the vehicle bounding box (bottom center for typical camera angles)
            front_x = cx
            front_y = y + h
            
            # Find closest existing vehicle to track movement
            matched_id = None
            min_dist = 100 # Maximum travel distance (pixels) allowable per-frame 
            
            for vid, data in self.tracked_vehicles.items():
                prev_cx, prev_cy, prev_front_x, prev_front_y = data
                dist = math.hypot(cx - prev_cx, cy - prev_cy)
                
                if dist < min_dist:
                    matched_id = vid
                    min_dist = dist
                    
            if matched_id is not None:
                # Ongoing Tracking Math
                prev_cx, prev_cy, prev_front_x, prev_front_y = self.tracked_vehicles[matched_id]
                current_tracked[matched_id] = (cx, cy, front_x, front_y)
                
                # Check which side of the line the vehicle was and is currently
                prev_side = get_line_side(prev_front_x, prev_front_y, self.line_p1, self.line_p2)
                curr_side = get_line_side(front_x, front_y, self.line_p1, self.line_p2)
                
                # [VIOLATION LOGIC STRICT RULE]
                # ONLY if previous known position was ABOVE line (prev_side < 0)
                # and current is on or BELOW line (curr_side >= 0).
                # This ensures we only capture vehicles moving forward.
                if prev_side < 0 and curr_side >= 0:
                    # STRICT RULE: Must be moving down/forward physically to avoid shake triggers
                    if front_y > prev_front_y + 2:
                        print(f"[ALERT] Tracked Vehicle #{matched_id} physically crossed virtual line! Violation Triggered.")
                        violation_detected = True
                    
                self.tracked_vehicles.pop(matched_id, None) # Claim to prevent double assignment
            else:
                # Register newly spotted vehicle above the line into memory tracking
                current_tracked[self.next_vehicle_id] = (cx, cy, front_x, front_y)
                self.next_vehicle_id += 1
                if self.next_vehicle_id > 10000: self.next_vehicle_id = 0 # reset overflow
                
        # Reassign memory to only what is currently visible on screen
        self.tracked_vehicles = current_tracked
        return violation_detected
