from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timedelta

from database import get_db
from models import User, Vehicle, Trip, MaintenanceLog, Expense, TripStatus, VehicleStatus
from schemas import DashboardStats, AnalyticsReports, MonthlySummary, VehicleCost
from auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    active_fleet = db.query(Vehicle).filter(Vehicle.status == VehicleStatus.On_Trip).count()

    maintenance_alerts = db.query(Vehicle).filter(Vehicle.status == VehicleStatus.In_Shop).count()

    total_vehicles = db.query(Vehicle).filter(Vehicle.status != VehicleStatus.Retired).count()
    utilization_vehicles = db.query(Vehicle).filter(
        Vehicle.status.in_([VehicleStatus.On_Trip, VehicleStatus.In_Shop])
    ).count()
    utilization_rate = (utilization_vehicles / total_vehicles * 100) if total_vehicles > 0 else 0.0

    pending_cargo = db.query(Trip).filter(Trip.status == TripStatus.Draft).count()

    recent_trips = db.query(Trip).order_by(Trip.created_at.desc()).limit(10).all()

    return DashboardStats(
        active_fleet=active_fleet,
        maintenance_alerts=maintenance_alerts,
        utilization_rate=round(utilization_rate, 2),
        pending_cargo=pending_cargo,
        recent_trips=recent_trips
    )


@router.get("/reports", response_model=AnalyticsReports)
def get_analytics_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_fuel_cost = db.query(func.coalesce(func.sum(Expense.fuel_cost), 0)).scalar()

    vehicles = db.query(Vehicle).filter(Vehicle.status != VehicleStatus.Retired).all()
    fleet_roi = []

    for vehicle in vehicles:
        revenue = db.query(func.coalesce(func.sum(Trip.actual_fuel_cost), 0)).filter(
            Trip.vehicle_id == vehicle.id,
            Trip.status == TripStatus.Completed
        ).scalar()

        fuel_cost = db.query(func.coalesce(func.sum(Expense.fuel_cost), 0)).filter(
            Expense.vehicle_id == vehicle.id
        ).scalar()

        maintenance_cost = db.query(func.coalesce(func.sum(MaintenanceLog.cost), 0)).filter(
            MaintenanceLog.vehicle_id == vehicle.id
        ).scalar()

        total_cost = float(fuel_cost) + float(maintenance_cost)
        roi = ((float(revenue) - total_cost) / vehicle.acquisition_cost * 100) if vehicle.acquisition_cost > 0 else 0.0

        fleet_roi.append({
            "vehicle_id": vehicle.id,
            "vehicle_name": vehicle.name,
            "revenue": float(revenue),
            "total_cost": total_cost,
            "roi": round(roi, 2)
        })

    fuel_efficiency = []
    for vehicle in vehicles:
        total_distance = db.query(func.coalesce(func.sum(Expense.distance_km), 0)).filter(
            Expense.vehicle_id == vehicle.id
        ).scalar()

        total_fuel = db.query(func.coalesce(func.sum(Expense.fuel_cost), 0)).filter(
            Expense.vehicle_id == vehicle.id
        ).scalar()

        efficiency = float(total_distance) / float(total_fuel) if total_fuel > 0 else 0.0

        fuel_efficiency.append({
            "vehicle_id": vehicle.id,
            "vehicle_name": vehicle.name,
            "total_distance": float(total_distance),
            "total_fuel_cost": float(total_fuel),
            "km_per_rupee": round(efficiency, 2)
        })

    monthly_data = {}
    trips = db.query(Trip).filter(Trip.status == TripStatus.Completed).all()
    for trip in trips:
        month_key = trip.completed_at.strftime("%Y-%m") if trip.completed_at else "Unknown"
        if month_key not in monthly_data:
            monthly_data[month_key] = {
                "revenue": 0.0,
                "fuel_cost": 0.0,
                "maintenance_cost": 0.0
            }
        monthly_data[month_key]["revenue"] += float(trip.actual_fuel_cost or 0)

    expenses = db.query(Expense).all()
    for expense in expenses:
        month_key = expense.created_at.strftime("%Y-%m")
        if month_key not in monthly_data:
            monthly_data[month_key] = {
                "revenue": 0.0,
                "fuel_cost": 0.0,
                "maintenance_cost": 0.0
            }
        monthly_data[month_key]["fuel_cost"] += float(expense.fuel_cost)

    logs = db.query(MaintenanceLog).all()
    for log in logs:
        month_key = log.service_date.strftime("%Y-%m")
        if month_key not in monthly_data:
            monthly_data[month_key] = {
                "revenue": 0.0,
                "fuel_cost": 0.0,
                "maintenance_cost": 0.0
            }
        monthly_data[month_key]["maintenance_cost"] += float(log.cost)

    monthly_summary = []
    for month in sorted(monthly_data.keys()):
        data = monthly_data[month]
        monthly_summary.append(MonthlySummary(
            month=month,
            revenue_proxy=data["revenue"],
            fuel_cost=data["fuel_cost"],
            maintenance_cost=data["maintenance_cost"],
            net_profit=data["revenue"] - (data["fuel_cost"] + data["maintenance_cost"])
        ))

    costliest_vehicles = []
    for vehicle in vehicles:
        fuel = db.query(func.coalesce(func.sum(Expense.fuel_cost), 0)).filter(
            Expense.vehicle_id == vehicle.id
        ).scalar()
        maintenance = db.query(func.coalesce(func.sum(MaintenanceLog.cost), 0)).filter(
            MaintenanceLog.vehicle_id == vehicle.id
        ).scalar()
        costliest_vehicles.append(VehicleCost(
            vehicle_id=vehicle.id,
            vehicle_name=vehicle.name,
            total_fuel_cost=float(fuel),
            total_maintenance_cost=float(maintenance),
            total_cost=float(fuel) + float(maintenance)
        ))

    costliest_vehicles.sort(key=lambda x: x.total_cost, reverse=True)
    costliest_vehicles = costliest_vehicles[:5]

    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    dead_stock = []
    for vehicle in vehicles:
        recent_trips = db.query(Trip).filter(
            Trip.vehicle_id == vehicle.id,
            Trip.status == TripStatus.Completed,
            Trip.completed_at >= thirty_days_ago
        ).count()

        if recent_trips == 0:
            dead_stock.append({
                "vehicle_id": vehicle.id,
                "vehicle_name": vehicle.name,
                "license_plate": vehicle.license_plate
            })

    return AnalyticsReports(
        total_fuel_cost=float(total_fuel_cost),
        fleet_roi=fleet_roi,
        fuel_efficiency=fuel_efficiency,
        monthly_summary=monthly_summary,
        costliest_vehicles=costliest_vehicles,
        dead_stock=dead_stock
    )
