from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import date, datetime, timedelta

from database import engine, SessionLocal, Base
from models import (
    User, Vehicle, Driver, Trip, MaintenanceLog, Expense,
    UserRole, VehicleType, VehicleStatus, DutyStatus, TripStatus, MaintenanceStatus
)
from auth import get_password_hash
from routers import auth, vehicles, drivers, trips, maintenance, expenses, analytics

app = FastAPI(title="FleetFlow API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(vehicles.router, prefix="/api/v1")
app.include_router(drivers.router, prefix="/api/v1")
app.include_router(trips.router, prefix="/api/v1")
app.include_router(maintenance.router, prefix="/api/v1")
app.include_router(expenses.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")


def seed_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    existing_user = db.query(User).filter(User.email == "admin@fleetflow.com").first()
    if existing_user:
        db.close()
        return

    admin_user = User(
        email="admin@fleetflow.com",
        hashed_password=get_password_hash("admin123"),
        role=UserRole.manager,
        is_active=True
    )
    db.add(admin_user)

    vehicles_data = [
        Vehicle(name="Ford Transit", license_plate="ABC-1234", type=VehicleType.Van, max_capacity_kg=1500, odometer_km=45000, status=VehicleStatus.Available, acquisition_cost=350000, model="2022"),
        Vehicle(name="Isuzu NPR", license_plate="XYZ-5678", type=VehicleType.Truck, max_capacity_kg=5000, odometer_km=78000, status=VehicleStatus.Available, acquisition_cost=850000, model="2021"),
        Vehicle(name="Honda Dio", license_plate="DL-9012", type=VehicleType.Bike, max_capacity_kg=150, odometer_km=12000, status=VehicleStatus.Available, acquisition_cost=75000, model="2023"),
    ]
    for v in vehicles_data:
        db.add(v)

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

    trips_data = [
        Trip(vehicle_id=vehicles_data[0].id, driver_id=drivers_data[0].id, cargo_weight_kg=800, origin="Mumbai", destination="Pune", status=TripStatus.Completed, estimated_fuel_cost=2500, actual_fuel_cost=2300, final_odometer=45200, completed_at=datetime.utcnow() - timedelta(days=2)),
        Trip(vehicle_id=vehicles_data[1].id, driver_id=drivers_data[1].id, cargo_weight_kg=3200, origin="Delhi", destination="Jaipur", status=TripStatus.Completed, estimated_fuel_cost=4500, actual_fuel_cost=4200, final_odometer=78500, completed_at=datetime.utcnow() - timedelta(days=5)),
        Trip(vehicle_id=vehicles_data[0].id, driver_id=drivers_data[2].id, cargo_weight_kg=1000, origin="Mumbai", destination="Ahmedabad", status=TripStatus.Dispatched, estimated_fuel_cost=3500),
        Trip(vehicle_id=vehicles_data[1].id, driver_id=drivers_data[0].id, cargo_weight_kg=2500, origin="Delhi", destination="Chandigarh", status=TripStatus.Draft, estimated_fuel_cost=3000),
        Trip(vehicle_id=vehicles_data[2].id, driver_id=drivers_data[1].id, cargo_weight_kg=100, origin="Bangalore", destination="Mysore", status=TripStatus.Cancelled, estimated_fuel_cost=500),
    ]
    for t in trips_data:
        db.add(t)

    maintenance_data = [
        MaintenanceLog(vehicle_id=vehicles_data[0].id, issue="Oil change required", service_date=date(2025, 1, 15), cost=2500, status=MaintenanceStatus.Resolved),
        MaintenanceLog(vehicle_id=vehicles_data[1].id, issue="Brake pad replacement", service_date=date(2025, 2, 10), cost=8000, status=MaintenanceStatus.New),
    ]
    for m in maintenance_data:
        db.add(m)

    expenses_data = [
        Expense(trip_id=trips_data[0].id, driver_id=drivers_data[0].id, vehicle_id=vehicles_data[0].id, fuel_cost=2300, misc_cost=200, distance_km=200),
        Expense(trip_id=trips_data[1].id, driver_id=drivers_data[1].id, vehicle_id=vehicles_data[1].id, fuel_cost=4200, misc_cost=500, distance_km=400),
        Expense(trip_id=None, driver_id=drivers_data[2].id, vehicle_id=vehicles_data[2].id, fuel_cost=150, misc_cost=50, distance_km=150),
    ]
    for e in expenses_data:
        db.add(e)

    db.commit()
    db.close()


@app.on_event("startup")
def startup_event():
    seed_data()


@app.get("/")
def root():
    return {"message": "FleetFlow API is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
