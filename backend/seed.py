from datetime import date, datetime, timedelta
from database import engine, SessionLocal, Base
from models import (
    User, Vehicle, Driver, Trip, MaintenanceLog, Expense,
    UserRole, VehicleType, VehicleStatus, DutyStatus, TripStatus, MaintenanceStatus,
    UnifiedExpense, ExpenseCategory
)
from auth import get_password_hash


def seed_database(drop_all=False):
    """Seed the database with initial data.
    
    Args:
        drop_all: If True, drops all tables and recreates them (default: False)
    """
    if drop_all:
        print("Dropping all tables...")
        Base.metadata.drop_all(bind=engine)
    
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        existing_user = db.query(User).filter(User.email == "admin@fleetflow.com").first()
        if existing_user:
            print("Database already seeded. Skipping...")
            return
        
        print("Seeding admin user...")
        admin_user = User(
            email="admin@fleetflow.com",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.manager,
            is_active=True
        )
        db.add(admin_user)
        
        print("Seeding vehicles...")
        vehicles_data = [
            Vehicle(name="Ford Transit", license_plate="ABC-1234", type=VehicleType.Van, max_capacity_kg=1500, odometer_km=45000, status=VehicleStatus.Available, acquisition_cost=350000, model="2022"),
            Vehicle(name="Isuzu NPR", license_plate="XYZ-5678", type=VehicleType.Truck, max_capacity_kg=5000, odometer_km=78000, status=VehicleStatus.Available, acquisition_cost=850000, model="2021"),
            Vehicle(name="Honda Dio", license_plate="DL-9012", type=VehicleType.Bike, max_capacity_kg=150, odometer_km=12000, status=VehicleStatus.Available, acquisition_cost=75000, model="2023"),
        ]
        for v in vehicles_data:
            db.add(v)
        
        print("Seeding drivers...")
        drivers_data = [
            Driver(name="John Smith", license_number="DL-111111", license_expiry=date(2027, 12, 31), completion_rate=95.0, safety_score=98.0, duty_status=DutyStatus.On_Duty),
            Driver(name="Maria Garcia", license_number="DL-222222", license_expiry=date(2026, 6, 15), completion_rate=88.0, safety_score=92.0, duty_status=DutyStatus.On_Duty),
            Driver(name="James Wilson", license_number="DL-333333", license_expiry=date(2025, 3, 20), completion_rate=100.0, safety_score=100.0, duty_status=DutyStatus.On_Duty),
        ]
        for d in drivers_data:
            db.add(d)
        
        db.commit()
        
        for v in vehicles_data:
            db.refresh(v)
        for d in drivers_data:
            db.refresh(d)
        
        print("Seeding trips...")
        trips_data = [
            Trip(vehicle_id=vehicles_data[0].id, driver_id=drivers_data[0].id, cargo_weight_kg=800, origin="Mumbai", destination="Pune", status=TripStatus.Completed, estimated_fuel_cost=2500, actual_fuel_cost=2300, final_odometer=45200, completed_at=datetime.utcnow() - timedelta(days=2)),
            Trip(vehicle_id=vehicles_data[1].id, driver_id=drivers_data[1].id, cargo_weight_kg=3200, origin="Delhi", destination="Jaipur", status=TripStatus.Completed, estimated_fuel_cost=4500, actual_fuel_cost=4200, final_odometer=78500, completed_at=datetime.utcnow() - timedelta(days=5)),
            Trip(vehicle_id=vehicles_data[0].id, driver_id=drivers_data[2].id, cargo_weight_kg=1000, origin="Mumbai", destination="Ahmedabad", status=TripStatus.Dispatched, estimated_fuel_cost=3500),
            Trip(vehicle_id=vehicles_data[1].id, driver_id=drivers_data[0].id, cargo_weight_kg=2500, origin="Delhi", destination="Chandigarh", status=TripStatus.Draft, estimated_fuel_cost=3000),
            Trip(vehicle_id=vehicles_data[2].id, driver_id=drivers_data[1].id, cargo_weight_kg=100, origin="Bangalore", destination="Mysore", status=TripStatus.Cancelled, estimated_fuel_cost=500),
        ]
        for t in trips_data:
            db.add(t)
        
        print("Seeding maintenance logs...")
        maintenance_data = [
            MaintenanceLog(vehicle_id=vehicles_data[0].id, issue="Oil change required", service_date=date(2025, 1, 15), cost=2500, status=MaintenanceStatus.Resolved),
            MaintenanceLog(vehicle_id=vehicles_data[1].id, issue="Brake pad replacement", service_date=date(2025, 2, 10), cost=8000, status=MaintenanceStatus.New),
        ]
        for m in maintenance_data:
            db.add(m)
        
        db.commit()
        
        for m in maintenance_data:
            db.refresh(m)
        
        print("Seeding unified expenses...")
        for vehicle in vehicles_data:
            if vehicle.acquisition_cost and vehicle.acquisition_cost > 0:
                expense = UnifiedExpense(
                    category=ExpenseCategory.Vehicle_Acquisition,
                    source_module="Vehicles",
                    source_id=vehicle.id,
                    description=f"Vehicle acquisition: {vehicle.name} ({vehicle.license_plate})",
                    amount=vehicle.acquisition_cost,
                    date=date.today(),
                    vehicle_id=vehicle.id
                )
                db.add(expense)
        
        completed_trips = [t for t in trips_data if t.status == TripStatus.Completed]
        for trip in completed_trips:
            fuel_expense = UnifiedExpense(
                category=ExpenseCategory.Trip_Fuel,
                source_module="Trips",
                source_id=trip.id,
                description=f"Fuel cost for Trip #{trip.id}: {trip.origin} → {trip.destination}",
                amount=trip.actual_fuel_cost or trip.estimated_fuel_cost or 0,
                date=trip.completed_at.date() if trip.completed_at else date.today(),
                vehicle_id=trip.vehicle_id,
                driver_id=trip.driver_id,
                trip_id=trip.id
            )
            db.add(fuel_expense)
        
        for maintenance in maintenance_data:
            expense = UnifiedExpense(
                category=ExpenseCategory.Maintenance_Repair,
                source_module="Maintenance",
                source_id=maintenance.id,
                description=f"Maintenance: {maintenance.issue} on Vehicle #{maintenance.vehicle_id}",
                amount=maintenance.cost,
                date=maintenance.service_date,
                vehicle_id=maintenance.vehicle_id,
                maintenance_id=maintenance.id
            )
            db.add(expense)
        
        for driver in drivers_data:
            expense = UnifiedExpense(
                category=ExpenseCategory.Driver_Compliance,
                source_module="Drivers",
                source_id=driver.id,
                description=f"Driver onboarding: {driver.name}",
                amount=0,
                date=date.today(),
                driver_id=driver.id
            )
            db.add(expense)
        
        misc_expense = UnifiedExpense(
            category=ExpenseCategory.Miscellaneous,
            source_module="Manual",
            description="Office supplies purchase",
            amount=1500,
            date=date.today(),
            driver_id=drivers_data[0].id
        )
        db.add(misc_expense)
        
        db.commit()
        print("Database seeded successfully!")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    import sys
    drop = "--drop" in sys.argv or "-d" in sys.argv
    seed_database(drop_all=drop)
