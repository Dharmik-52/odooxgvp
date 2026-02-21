from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from database import get_db
from models import User, Expense, Vehicle, MaintenanceLog, Trip, TripStatus
from schemas import ExpenseCreate, ExpenseResponse, VehicleCost
from auth import get_current_user

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.get("/", response_model=List[ExpenseResponse])
def get_expenses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_db)
):
    return db.query(Expense).order_by(Expense.created_at.desc()).all()


@router.post("/", response_model=ExpenseResponse)
def create_expense(
    expense_data: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense = Expense(**expense_data.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.get("/vehicle/{vehicle_id}", response_model=VehicleCost)
def get_vehicle_cost(
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

    total_fuel = db.query(func.coalesce(func.sum(Expense.fuel_cost), 0)).filter(
        Expense.vehicle_id == vehicle_id
    ).scalar()

    total_maintenance = db.query(func.coalesce(func.sum(MaintenanceLog.cost), 0)).filter(
        MaintenanceLog.vehicle_id == vehicle_id
    ).scalar()

    return VehicleCost(
        vehicle_id=vehicle_id,
        vehicle_name=vehicle.name,
        total_fuel_cost=float(total_fuel),
        total_maintenance_cost=float(total_maintenance),
        total_cost=float(total_fuel) + float(total_maintenance)
    )


@router.get("/summary")
def get_expenses_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vehicles = db.query(Vehicle).all()
    summary = []

    for vehicle in vehicles:
        total_fuel = db.query(func.coalesce(func.sum(Expense.fuel_cost), 0)).filter(
            Expense.vehicle_id == vehicle.id
        ).scalar()

        total_maintenance = db.query(func.coalesce(func.sum(MaintenanceLog.cost), 0)).filter(
            MaintenanceLog.vehicle_id == vehicle.id
        ).scalar()

        revenue = db.query(func.coalesce(func.sum(Trip.actual_fuel_cost), 0)).join(Trip, Trip.vehicle_id == Vehicle.id).filter(
            Trip.vehicle_id == vehicle.id,
            Trip.status == TripStatus.Completed
        ).scalar()

        summary.append({
            "vehicle_id": vehicle.id,
            "vehicle_name": vehicle.name,
            "total_fuel_cost": float(total_fuel),
            "total_maintenance_cost": float(total_maintenance),
            "revenue": float(revenue),
            "net_profit": float(revenue) - (float(total_fuel) + float(total_maintenance))
        })

    return summary
