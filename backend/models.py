from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Enum, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from database import Base


class UserRole(str, enum.Enum):
    manager = "manager"
    dispatcher = "dispatcher"


class VehicleType(str, enum.Enum):
    Truck = "Truck"
    Van = "Van"
    Bike = "Bike"


class VehicleStatus(str, enum.Enum):
    Available = "Available"
    On_Trip = "On_Trip"
    In_Shop = "In_Shop"
    Retired = "Retired"


class DutyStatus(str, enum.Enum):
    On_Duty = "On_Duty"
    Off_Duty = "Off_Duty"
    Suspended = "Suspended"


class TripStatus(str, enum.Enum):
    Draft = "Draft"
    Dispatched = "Dispatched"
    Completed = "Completed"
    Cancelled = "Cancelled"


class MaintenanceStatus(str, enum.Enum):
    New = "New"
    In_Progress = "In_Progress"
    Resolved = "Resolved"


class ExpenseCategory(str, enum.Enum):
    Vehicle_Acquisition = "Vehicle_Acquisition"
    Trip_Fuel = "Trip_Fuel"
    Trip_Operational = "Trip_Operational"
    Maintenance_Repair = "Maintenance_Repair"
    Driver_Compliance = "Driver_Compliance"
    Miscellaneous = "Miscellaneous"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    license_plate = Column(String, unique=True, nullable=False, index=True)
    type = Column(Enum(VehicleType), nullable=False)
    max_capacity_kg = Column(Float, nullable=False)
    odometer_km = Column(Float, default=0.0)
    status = Column(Enum(VehicleStatus), default=VehicleStatus.Available)
    acquisition_cost = Column(Float, default=0.0)
    model = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    trips = relationship("Trip", back_populates="vehicle")
    maintenance_logs = relationship("MaintenanceLog", back_populates="vehicle")
    expenses = relationship("Expense", back_populates="vehicle")


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    license_number = Column(String, unique=True, nullable=False, index=True)
    license_expiry = Column(Date, nullable=False)
    completion_rate = Column(Float, default=100.0)
    safety_score = Column(Float, default=100.0)
    duty_status = Column(Enum(DutyStatus), default=DutyStatus.On_Duty)
    created_at = Column(DateTime, server_default=func.now())

    trips = relationship("Trip", back_populates="driver")
    expenses = relationship("Expense", back_populates="driver")


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    cargo_weight_kg = Column(Float, nullable=False)
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    status = Column(Enum(TripStatus), default=TripStatus.Draft)
    estimated_fuel_cost = Column(Float, default=0.0)
    actual_fuel_cost = Column(Float, nullable=True)
    final_odometer = Column(Float, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    completed_at = Column(DateTime, nullable=True)

    vehicle = relationship("Vehicle", back_populates="trips")
    driver = relationship("Driver", back_populates="trips")
    expenses = relationship("Expense", back_populates="trip")


class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    issue = Column(String, nullable=False)
    service_type = Column(String, nullable=False)
    cost = Column(Float, default=0.0)
    service_date = Column(Date, nullable=False)
    status = Column(String, default="New")
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    resolved_at = Column(DateTime, nullable=True)

    vehicle = relationship("Vehicle", back_populates="maintenance_logs")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    fuel_cost = Column(Float, default=0.0)
    misc_cost = Column(Float, default=0.0)
    distance_km = Column(Float, default=0.0)
    created_at = Column(DateTime, server_default=func.now())

    trip = relationship("Trip", back_populates="expenses")
    driver = relationship("Driver", back_populates="expenses")
    vehicle = relationship("Vehicle", back_populates="expenses")


class UnifiedExpense(Base):
    __tablename__ = "unified_expenses"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(Enum(ExpenseCategory), nullable=False)
    source_module = Column(String, nullable=False)
    source_id = Column(Integer, nullable=True)
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=True)
    maintenance_id = Column(Integer, ForeignKey("maintenance_logs.id"), nullable=True)
    note = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    vehicle = relationship("Vehicle")
    driver = relationship("Driver")
    trip = relationship("Trip")
    maintenance = relationship("MaintenanceLog")
