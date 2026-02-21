from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date, datetime

from database import get_db
from models import User, Vehicle, Driver, Trip, VehicleStatus, DutyStatus, TripStatus, UnifiedExpense, ExpenseCategory, UserRole
from schemas import TripCreate, TripUpdate, TripResponse, TripStatusUpdate
from auth import get_current_user

router = APIRouter(prefix="/trips", tags=["trips"])


@router.get("/", response_model=List[TripResponse])
def get_trips(
    status: Optional[TripStatus] = None,
    vehicle_id: Optional[int] = None,
    driver_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Trip)
    if status:
        query = query.filter(Trip.status == status)
    if vehicle_id:
        query = query.filter(Trip.vehicle_id == vehicle_id)
    if driver_id:
        query = query.filter(Trip.driver_id == driver_id)
    return query.order_by(Trip.created_at.desc()).all()


@router.get("/driver/current", response_model=TripResponse)
def get_current_driver_trip(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Ensure only drivers can access this
    if current_user.role != UserRole.dispatcher:  # Note: currently driver seeded as dispatcher role
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only drivers can access their current trip"
        )
        
    driver = db.query(Driver).filter(Driver.user_id == current_user.id).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver profile not found for the current user"
        )

    # Fetch currently active trips (Dispatched status) for this driver
    active_trip = db.query(Trip).filter(
        Trip.driver_id == driver.id,
        Trip.status == TripStatus.Dispatched
    ).first()
    
    if not active_trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active trip found for the driver"
        )
        
    return active_trip


@router.get("/{trip_id}", response_model=TripResponse)
def get_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )
    return trip


@router.post("/", response_model=TripResponse)
def create_trip(
    trip_data: TripCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == trip_data.vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    if vehicle.status != VehicleStatus.Available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle not available"
        )

    driver = db.query(Driver).filter(Driver.id == trip_data.driver_id).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found"
        )

    if driver.duty_status != DutyStatus.On_Duty:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Driver not eligible"
        )

    if driver.license_expiry < date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Driver license expired"
        )

    if trip_data.cargo_weight_kg > vehicle.max_capacity_kg:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cargo exceeds vehicle capacity of {vehicle.max_capacity_kg}kg"
        )

    trip = Trip(
        **trip_data.model_dump(),
        status=TripStatus.Dispatched
    )
    db.add(trip)

    vehicle.status = VehicleStatus.On_Trip

    db.commit()
    db.refresh(trip)
    return trip


@router.patch("/{trip_id}/status", response_model=TripResponse)
def update_trip_status(
    trip_id: int,
    status_data: TripStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )

    vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
    driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()

    if status_data.status == TripStatus.Completed:
        trip.status = TripStatus.Completed
        trip.completed_at = datetime.utcnow()

        if status_data.final_odometer:
            trip.final_odometer = status_data.final_odometer
            vehicle.odometer_km = status_data.final_odometer

        if status_data.actual_distance_km:
            trip.actual_distance_km = status_data.actual_distance_km

        if status_data.actual_fuel_cost:
            trip.actual_fuel_cost = status_data.actual_fuel_cost

        fuel_cost = trip.actual_fuel_cost or trip.estimated_fuel_cost or 0
        
        if fuel_cost > 0:
            fuel_expense = UnifiedExpense(
                category=ExpenseCategory.Trip_Fuel,
                source_module="Trips",
                source_id=trip.id,
                description=f"Fuel cost for Trip #{trip.id}: {trip.origin} → {trip.destination}",
                amount=fuel_cost,
                date=date.today(),
                vehicle_id=trip.vehicle_id,
                driver_id=trip.driver_id,
                trip_id=trip.id
            )
            db.add(fuel_expense)

        if trip.revenue > 0:
            revenue_expense = UnifiedExpense(
                category=ExpenseCategory.Trip_Operational,
                source_module="Trips",
                source_id=trip.id,
                description=f"Trip revenue: {trip.origin} → {trip.destination}",
                amount=-trip.revenue,
                date=date.today(),
                vehicle_id=trip.vehicle_id,
                driver_id=trip.driver_id,
                trip_id=trip.id
            )
            db.add(revenue_expense)

        vehicle.status = VehicleStatus.Available
        driver.duty_status = DutyStatus.On_Duty

        if driver.completion_rate < 100.0:
            driver.completion_rate = min(100.0, driver.completion_rate + 5.0)

    elif status_data.status == TripStatus.Cancelled:
        trip.status = TripStatus.Cancelled
        vehicle.status = VehicleStatus.Available
        driver.duty_status = DutyStatus.On_Duty
    else:
        trip.status = status_data.status

    db.commit()
    db.refresh(trip)
    return trip


@router.put("/{trip_id}", response_model=TripResponse)
def update_trip(
    trip_id: int,
    trip_data: TripUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )

    update_data = trip_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(trip, field, value)

    db.commit()
    db.refresh(trip)
    return trip
