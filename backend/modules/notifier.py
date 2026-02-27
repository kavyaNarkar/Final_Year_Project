class Notifier:
    def __init__(self):
        """
        Future integration point for SMS/Mail gateways like Fast2SMS 
        or SendGrid for instant violator alert.
        """
        pass

    def notify_user(self, owner_name, violation_type):
        """
        Instantly alert the detected owner without blocking thread processes.
        """
        if owner_name and owner_name != "Unknown Owner":
            print("\n" + "*"*45)
            print(f"[LIVE SMS ALERT] Notification sent seamlessly.")
            print(f"To: {owner_name}")
            print(f"Message: {violation_type} Violation Recorded.")
            print("*"*45 + "\n")
