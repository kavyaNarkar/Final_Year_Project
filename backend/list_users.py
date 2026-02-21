from app import app, db, User
with app.app_context():
    users = User.query.all()
    print("Users Found:", len(users))
    for u in users:
        print(f"ID: {u.id}, Email: {u.email}, Vehicle: {u.vehicle_number}")
