import serial

ser = serial.Serial("COM5",9600)

while True:
    line = ser.readline().decode().strip()
    print(line)