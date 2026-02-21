from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import User, Vehicle, MaintenanceLog, VehicleStatus, MaintenanceStatus
from schemas import MaintenanceLogCreate, MaintenanceLogUpdate, MaintenanceLogResponse
from auth import get_current_user

router = APIRouter(prefix="/maintenance", tags=["maintenance"])


@router.get("/", response_model=List[MaintenanceLogResponse])
def get_maintenance_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(MaintenanceLog).order_by(MaintenanceLog.created_at.desc()).all()


@router.post("/", response_model=MaintenanceLogResponse)
def create_maintenance_log(
    log_data: MaintenanceLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == log_data.vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    maintenance_log = MaintenanceLog(**log_data.model_dump())
    db.add(maintenance_log)

    vehicle.status = VehicleStatus.In_Shop

    db.commit()
    db.refresh(maintenance_log)
    return maintenance_log


@router.patch("/{log_id}/resolve", response_model=MaintenanceLogResponse)
def resolve_maintenance_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    log = db.query(MaintenanceLog).filter(MaintenanceLog.id == log_id).first()
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance log not found"
        )

    vehicle = db.query(Vehicle).filter(Vehicle.id == log.vehicle_id).first()

    log.status = MaintenanceStatus.Resolved

    active_maintenance = db.query(MaintenanceLog).filter(
        MaintenanceLog.vehicle_id == log.vehicle_id,
        MaintenanceLog.status != MaintenanceStatus.Resolved
    ).count()

    if active_maintenance == 0:
        vehicle.status = VehicleStatus.Available

    db.commit()
    db.refresh(log)
    return log


@router.put("/{log_id}", response_model=MaintenanceLogResponse)
def update_maintenance_log(
    log_id: int,
    log_data: MaintenanceLogUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    log = db.query(MaintenanceLog).filter(MaintenanceLog.id == log_id).first()
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance log not found"
        )

    update_data = log_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(log, field, value)

    db.commit()
    db.refresh(log)
    return log
