from app import app, db, User, Admin
with app.app_context():
    print('Admins:', [(a.username, a.email) for a in Admin.query.all()])
    print('Users:', [(u.email, u.vehicle_number) for u in User.query.all()])
