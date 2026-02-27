import math

class SignalJumpDetector:
    def __init__(self, virtual_line_y=300):
        # [VIRTUAL LINE POSITION CONFIGURATION]
        # To adjust the virtual line on the screen:
        # - INCREASE this number to move the line DOWN
        # - DECREASE this number to move the line UP
        self.virtual_line_y = virtual_line_y
        self.signal_state = 'RED' # Can be interfaced dynamically (RED/YELLOW/GREEN)
        
        # State memory per vehicle to prevent jitter/camera shake violations
        self.tracked_vehicles = {}
        self.next_vehicle_id = 0

    def set_signal_state(self, state):
        self.signal_state = state.upper()

    def check_violation(self, vehicles):
        """
        Logic: Any detected vehicle crossing the virtual line triggers violation.
        Uses tracking to ensure NO camera shake triggers violation.
        A vehicle MUST geometrically travel from above the line to below the line.
        """
        current_tracked = {}
        violation_detected = False
            
        for (x, y, w, h) in vehicles:
            cx = x + w // 2
            cy = y + h // 2
            vehicle_bottom = y + h
            
            # Find closest existing vehicle to track movement
            matched_id = None
            min_dist = 100 # Maximum travel distance (pixels) allowable per-frame 
            
            for vid, data in self.tracked_vehicles.items():
                prev_cx, prev_cy, prev_bottom = data
                dist = math.hypot(cx - prev_cx, cy - prev_cy)
                
                if dist < min_dist:
                    matched_id = vid
                    min_dist = dist
                    
            if matched_id is not None:
                # Ongoing Tracking Math
                prev_cx, prev_cy, prev_bottom = self.tracked_vehicles[matched_id]
                current_tracked[matched_id] = (cx, cy, vehicle_bottom)
                
                # [VIOLATION LOGIC STRICT RULE]
                # ONLY if previous known bottom was ABOVE line and current is BELOW line
                # This guarantees camera drops/shakes cannot trigger false positives
                if prev_bottom <= self.virtual_line_y and vehicle_bottom > self.virtual_line_y:
                    print(f"[ALERT] Tracked Vehicle #{matched_id} physically crossed line! Violation Triggered.")
                    violation_detected = True
                    
                self.tracked_vehicles.pop(matched_id, None) # Claim to prevent double assignment
            else:
                # Register newly spotted vehicle above the line into memory tracking
                current_tracked[self.next_vehicle_id] = (cx, cy, vehicle_bottom)
                self.next_vehicle_id += 1
                if self.next_vehicle_id > 10000: self.next_vehicle_id = 0 # reset overflow
                
        # Reassign memory to only what is currently visible on screen
        self.tracked_vehicles = current_tracked
        return violation_detected
