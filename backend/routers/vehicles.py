from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date

from database import get_db
from models import User, Vehicle, VehicleStatus, UnifiedExpense, ExpenseCategory
from schemas import VehicleCreate, VehicleUpdate, VehicleResponse
from auth import get_current_user, require_role

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


@router.get("/", response_model=List[VehicleResponse])
def get_vehicles(
    status: Optional[VehicleStatus] = None,
    type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Vehicle)
    if status:
        query = query.filter(Vehicle.status == status)
    if type:
        query = query.filter(Vehicle.type == type)
    return query.all()


@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    return vehicle


@router.post("/", response_model=VehicleResponse)
def create_vehicle(
    vehicle_data: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["manager"]))
):
    existing = db.query(Vehicle).filter(Vehicle.license_plate == vehicle_data.license_plate).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="License plate already exists"
        )

    vehicle = Vehicle(**vehicle_data.model_dump())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)

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
        db.commit()

    return vehicle


@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(
    vehicle_id: int,
    vehicle_data: VehicleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["manager"]))
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    update_data = vehicle_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(vehicle, field, value)

    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.delete("/{vehicle_id}")
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["manager"]))
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    db.delete(vehicle)
    db.commit()
    return {"message": "Vehicle deleted successfully"}


@router.patch("/{vehicle_id}/retire", response_model=VehicleResponse)
def retire_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["manager"]))
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    vehicle.status = VehicleStatus.Retired
    db.commit()
    db.refresh(vehicle)
    return vehicle
