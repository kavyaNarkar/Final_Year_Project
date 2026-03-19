import serial
import serial.tools.list_ports
import threading
import time

class SignalReader:
    def __init__(self, port=None, baud_rate=9600):
        # Fallback to COM8 as it was detected as the Arduino Uno on this system, rather than COM5
        self.port = port
        self.baud_rate = baud_rate
        self.current_signal_state = "GREEN"  # Default safe state
        self.serial_conn = None
        self.is_running = True
        self.thread = threading.Thread(target=self._read_loop, daemon=True)
        self.thread.start()

    def _auto_detect_port(self):
        """Attempts to find the Arduino automatically."""
        ports = serial.tools.list_ports.comports()
        for p in ports:
            # Look for common Arduino/CH340 descriptors
            if any(key in p.description for key in ["Arduino", "CH340", "USB Serial", "Silicon Labs"]):
                return p.device
        return "COM8" # fallback for this specific system

    def _connect(self):
        """Persistent connection retry logic for ISSSUE 1."""
        while self.is_running and self.serial_conn is None:
            target_port = self.port if self.port else self._auto_detect_port()
            try:
                self.serial_conn = serial.Serial(target_port, self.baud_rate, timeout=1)
                print(f"[Signal Reader] Serial Connection established on {target_port}")
                return
            except Exception as e:
                print(f"[Signal Reader] Still waiting for Arduino on {target_port}... {e}")
                time.sleep(2)  # Wait before retrying

    def _read_loop(self):
        """Background thread to read signal data loop (REQU_LOGIC 2 & 3)."""
        while self.is_running:
            if self.serial_conn is None or not self.serial_conn.is_open:
                self._connect()

            if self.serial_conn is not None and self.serial_conn.is_open:
                try:
                    # Logic 2: Read raw line
                    raw_line = self.serial_conn.readline()
                    if raw_line:
                        # Logic 3: Clean input properly (Remove \r\n, Strip, Upper)
                        signal = raw_line.decode('utf-8', errors='ignore').strip().upper()
                        
                        # Logic 4: Filter allowed values and update shared variable
                        if signal in ["RED", "YELLOW", "GREEN"]:
                            if self.current_signal_state != signal:
                                self.current_signal_state = signal
                                # Logic 5: Console logging
                                print("Signal State:", self.current_signal_state)
                except Exception as e:
                    print(f"[Signal Reader] Port lost: {e}. Reconnecting...")
                    if self.serial_conn:
                        self.serial_conn.close()
                    self.serial_conn = None
            time.sleep(0.01) # performance yield

    def get_state(self):
        return self.current_signal_state

    def stop(self):
        self.is_running = False
        if self.serial_conn and self.serial_conn.is_open:
            self.serial_conn.close()
