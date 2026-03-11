import serial
import threading
import time

class SignalReader:
    def __init__(self, port="COM5", baud_rate=9600):
        self.port = port
        self.baud_rate = baud_rate
        self.current_signal_state = "GREEN"  # Default safe state
        self.serial_conn = None
        self.is_running = True
        self.thread = threading.Thread(target=self._read_loop, daemon=True)
        self.thread.start()

    def _connect(self):
        """Attempts to connect to the Arduino."""
        while self.is_running and self.serial_conn is None:
            try:
                self.serial_conn = serial.Serial(self.port, self.baud_rate, timeout=1)
                print(f"\n[Signal Reader] Connected to Arduino via serial port on {self.port}")
                return
            except Exception as e:
                print(f"\n[Signal Reader] Waiting for Arduino connection on {self.port}: {e}")
                time.sleep(2)  # Wait before retrying

    def _read_loop(self):
        """Background thread that continuously reads the signal state from the Arduino."""
        while self.is_running:
            if self.serial_conn is None or not self.serial_conn.is_open:
                self._connect()

            if self.serial_conn is not None and self.serial_conn.is_open:
                try:
                    raw_line = self.serial_conn.readline()
                    if raw_line:
                        signal = raw_line.decode('utf-8', errors='ignore').strip().upper()
                        
                        if signal in ["RED", "YELLOW", "GREEN"]:
                            if self.current_signal_state != signal:
                                self.current_signal_state = signal
                                print("Signal state:", self.current_signal_state)
                except Exception as e:
                    print(f"\n[Signal Reader] Serial connection lost: {e}. Attempting to reconnect...")
                    if self.serial_conn:
                        self.serial_conn.close()
                    self.serial_conn = None
            time.sleep(0.01)

    def get_state(self):
        return self.current_signal_state

    def stop(self):
        self.is_running = False
        if self.serial_conn and self.serial_conn.is_open:
            self.serial_conn.close()
