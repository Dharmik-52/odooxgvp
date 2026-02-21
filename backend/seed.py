from datetime import date, datetime, timedelta
from database import engine, SessionLocal, Base
from models import (
    User, Vehicle, Driver, Trip, MaintenanceLog, Expense,
    UserRole, VehicleType, VehicleStatus, DutyStatus, TripStatus, MaintenanceStatus,
    UnifiedExpense, ExpenseCategory
)
from auth import get_password_hash


def seed_database(drop_all=False):
    """Seed the database with comprehensive trial data.
    
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
        if existing_user and not drop_all:
            print("Database already seeded. Skipping...")
            return
        
        print("Seeding admin user...")
        admin_user = User(
            email="admin@fleetflow.com",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.manager,
            full_name="System Admin",
            is_active=True
        )
        db.add(admin_user)
        
        print("Seeding driver/dispatcher users...")
        driver_user1 = User(
            email="john@fleetflow.com",
            hashed_password=get_password_hash("driver123"),
            role=UserRole.dispatcher,
            full_name="John Smith",
            is_active=True
        )
        driver_user2 = User(
            email="maria@fleetflow.com",
            hashed_password=get_password_hash("driver123"),
            role=UserRole.dispatcher,
            full_name="Maria Garcia",
            is_active=True
        )
        driver_user3 = User(
            email="david@fleetflow.com",
            hashed_password=get_password_hash("driver123"),
            role=UserRole.dispatcher,
            full_name="David Chen",
            is_active=True
        )
        db.add_all([driver_user1, driver_user2, driver_user3])
        db.commit()
        db.refresh(driver_user1)
        db.refresh(driver_user2)
        db.refresh(driver_user3)
        
        print("Seeding vehicles...")
        vehicles_data = [
            Vehicle(name="Ford Transit Alpha", license_plate="ABC-1234", type=VehicleType.Van, max_capacity_kg=1500, odometer_km=45200, status=VehicleStatus.Available, acquisition_cost=35000, model="2022"),
            Vehicle(name="Isuzu NPR Heavy", license_plate="XYZ-5678", type=VehicleType.Truck, max_capacity_kg=5000, odometer_km=78500, status=VehicleStatus.On_Trip, acquisition_cost=85000, model="2021"),
            Vehicle(name="Honda Dio Express", license_plate="DL-9012", type=VehicleType.Bike, max_capacity_kg=150, odometer_km=12500, status=VehicleStatus.Available, acquisition_cost=3500, model="2023"),
            Vehicle(name="Mercedes Sprinter", license_plate="DEF-8888", type=VehicleType.Van, max_capacity_kg=2000, odometer_km=15000, status=VehicleStatus.In_Shop, acquisition_cost=45000, model="2023"),
            Vehicle(name="Volvo FH16", license_plate="VOL-1111", type=VehicleType.Truck, max_capacity_kg=20000, odometer_km=120000, status=VehicleStatus.Available, acquisition_cost=150000, model="2019"),
            Vehicle(name="Old Ford Transit", license_plate="OLD-9999", type=VehicleType.Van, max_capacity_kg=1500, odometer_km=250000, status=VehicleStatus.Retired, acquisition_cost=25000, model="2015"),
        ]
        db.add_all(vehicles_data)
        db.commit()
        for v in vehicles_data: db.refresh(v)
        
        print("Seeding drivers...")
        drivers_data = [
            Driver(name="John Smith", license_number="DL-111111", license_expiry=date(2027, 12, 31), completion_rate=95.0, safety_score=98.0, duty_status=DutyStatus.On_Duty),
            Driver(name="Maria Garcia", license_number="DL-222222", license_expiry=date(2026, 6, 15), completion_rate=88.0, safety_score=92.0, duty_status=DutyStatus.On_Duty),
            Driver(name="David Chen", license_number="DL-333333", license_expiry=date(2025, 3, 20), completion_rate=100.0, safety_score=100.0, duty_status=DutyStatus.Off_Duty),
            Driver(name="Alex Johnson", license_number="DL-444444", license_expiry=date(2024, 1, 10), completion_rate=75.0, safety_score=60.0, duty_status=DutyStatus.Suspended),
            Driver(name="Sarah Williams", license_number="DL-555555", license_expiry=date(2028, 5, 5), completion_rate=99.0, safety_score=95.0, duty_status=DutyStatus.On_Duty),
        ]
        db.add_all(drivers_data)
        db.commit()
        for d in drivers_data: db.refresh(d)
        
        print("Seeding trips...")
        now = datetime.utcnow()
        trips_data = [
            # Completed trips
            Trip(vehicle_id=vehicles_data[0].id, driver_id=drivers_data[0].id, cargo_weight_kg=800, origin="Mumbai", destination="Pune", status=TripStatus.Completed, estimated_fuel_cost=250, actual_fuel_cost=230, final_odometer=45200, completed_at=now - timedelta(days=2)),
            Trip(vehicle_id=vehicles_data[1].id, driver_id=drivers_data[1].id, cargo_weight_kg=3200, origin="Delhi", destination="Jaipur", status=TripStatus.Completed, estimated_fuel_cost=450, actual_fuel_cost=420, final_odometer=78000, completed_at=now - timedelta(days=5)),
            Trip(vehicle_id=vehicles_data[4].id, driver_id=drivers_data[4].id, cargo_weight_kg=15000, origin="Chennai", destination="Bangalore", status=TripStatus.Completed, estimated_fuel_cost=1200, actual_fuel_cost=1150, final_odometer=119500, completed_at=now - timedelta(days=1)),
            
            # Dispatched (Active) trips
            Trip(vehicle_id=vehicles_data[1].id, driver_id=drivers_data[0].id, cargo_weight_kg=2500, origin="Delhi", destination="Chandigarh", status=TripStatus.Dispatched, estimated_fuel_cost=300),
            Trip(vehicle_id=vehicles_data[2].id, driver_id=drivers_data[1].id, cargo_weight_kg=50, origin="Local Hub", destination="Downtown", status=TripStatus.Dispatched, estimated_fuel_cost=15),
            
            # Draft trips
            Trip(vehicle_id=vehicles_data[0].id, driver_id=drivers_data[4].id, cargo_weight_kg=1000, origin="Mumbai", destination="Ahmedabad", status=TripStatus.Draft, estimated_fuel_cost=350),
            Trip(vehicle_id=vehicles_data[4].id, driver_id=drivers_data[2].id, cargo_weight_kg=18000, origin="Kolkata", destination="Patna", status=TripStatus.Draft, estimated_fuel_cost=1500),

            # Cancelled trips
            Trip(vehicle_id=vehicles_data[2].id, driver_id=drivers_data[2].id, cargo_weight_kg=100, origin="Bangalore", destination="Mysore", status=TripStatus.Cancelled, estimated_fuel_cost=50),
        ]
        db.add_all(trips_data)
        db.commit()
        for t in trips_data: db.refresh(t)
        
        print("Seeding maintenance logs...")
        maintenance_data = [
            MaintenanceLog(vehicle_id=vehicles_data[0].id, issue="Routine Oil Change", service_type="Routine", service_date=date(2025, 1, 15), cost=150, status="Resolved", notes="Standard 10k mile oil change.", resolved_at=now - timedelta(days=30)),
            MaintenanceLog(vehicle_id=vehicles_data[1].id, issue="Brake pad wear", service_type="Repair", service_date=date(2025, 2, 10), cost=800, status="Resolved", notes="Replaced front and rear pads.", resolved_at=now - timedelta(days=5)),
            MaintenanceLog(vehicle_id=vehicles_data[3].id, issue="Engine checking light on", service_type="Inspection", service_date=date.today(), cost=0, status="New", notes="Needs full diagnostic scan."),
            MaintenanceLog(vehicle_id=vehicles_data[4].id, issue="Transmission fluid leak", service_type="Repair", service_date=date.today() - timedelta(days=1), cost=1200, status="In_Progress", notes="Awaiting parts from supplier."),
            MaintenanceLog(vehicle_id=vehicles_data[5].id, issue="End of life evaluation", service_type="Inspection", service_date=date(2024, 12, 1), cost=500, status="Resolved", notes="Vehicle retired due to excessive wear.", resolved_at=now - timedelta(days=80)),
        ]
        db.add_all(maintenance_data)
        db.commit()
        for m in maintenance_data: db.refresh(m)
        
        print("Seeding unified expenses for analytics...")
        expenses = []
        
        # Vehicle Acquisition Expenses
        for vehicle in vehicles_data:
            if vehicle.acquisition_cost and vehicle.acquisition_cost > 0:
                expenses.append(UnifiedExpense(
                    category=ExpenseCategory.Vehicle_Acquisition,
                    source_module="Vehicles",
                    source_id=vehicle.id,
                    description=f"Vehicle acquisition: {vehicle.name}",
                    amount=vehicle.acquisition_cost,
                    date=date.today() - timedelta(days=100), # somewhat arbitrary past date
                    vehicle_id=vehicle.id
                ))
        
        # Trip Fuel Expenses (Completed only)
        completed_trips = [t for t in trips_data if t.status == TripStatus.Completed]
        for trip in completed_trips:
            expenses.append(UnifiedExpense(
                category=ExpenseCategory.Trip_Fuel,
                source_module="Trips",
                source_id=trip.id,
                description=f"Fuel: Trip #{trip.id} ({trip.origin} → {trip.destination})",
                amount=trip.actual_fuel_cost or trip.estimated_fuel_cost or 0,
                date=trip.completed_at.date() if trip.completed_at else date.today(),
                vehicle_id=trip.vehicle_id,
                driver_id=trip.driver_id,
                trip_id=trip.id
            ))
            
            # Random operational expense per trip
            expenses.append(UnifiedExpense(
                category=ExpenseCategory.Trip_Operational,
                source_module="Trips",
                source_id=trip.id,
                description=f"Tolls & Parking: Trip #{trip.id}",
                amount=45.50,
                date=trip.completed_at.date() if trip.completed_at else date.today(),
                vehicle_id=trip.vehicle_id,
                driver_id=trip.driver_id,
                trip_id=trip.id
            ))
        
        # Maintenance Expenses
        for maintenance in maintenance_data:
            if maintenance.cost > 0:
                expenses.append(UnifiedExpense(
                    category=ExpenseCategory.Maintenance_Repair,
                    source_module="Maintenance",
                    source_id=maintenance.id,
                    description=f"Maintenance: {maintenance.issue}",
                    amount=maintenance.cost,
                    date=maintenance.service_date,
                    vehicle_id=maintenance.vehicle_id,
                    maintenance_id=maintenance.id
                ))
        
        # Driver Compliance
        for driver in drivers_data:
            expenses.append(UnifiedExpense(
                category=ExpenseCategory.Driver_Compliance,
                source_module="Drivers",
                source_id=driver.id,
                description=f"Driver compliance/certification: {driver.name}",
                amount=150.0,
                date=date.today() - timedelta(days=30),
                driver_id=driver.id
            ))
        
        # Miscellaneous
        expenses.append(UnifiedExpense(
            category=ExpenseCategory.Miscellaneous,
            source_module="Manual",
            description="Office supplies & Routing software licenses",
            amount=1500,
            date=date.today() - timedelta(days=2),
            driver_id=drivers_data[0].id
        ))
        
        db.add_all(expenses)
        db.commit()
        
        print("Database seeded with extensive trial data successfully!")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    drop = "--drop" in sys.argv or "-d" in sys.argv
    seed_database(drop_all=drop)
