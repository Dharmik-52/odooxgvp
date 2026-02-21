from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timedelta

from database import get_db
from models import User, Vehicle, Trip, MaintenanceLog, Expense, TripStatus, VehicleStatus, Driver, UnifiedExpense, ExpenseCategory
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
    # 1. Total Fuel Cost from UnifiedExpense instead of empty Expense table
    total_fuel_cost = db.query(func.coalesce(func.sum(UnifiedExpense.amount), 0)).filter(
        UnifiedExpense.category == ExpenseCategory.Trip_Fuel
    ).scalar()

    vehicles = db.query(Vehicle).filter(Vehicle.status != VehicleStatus.Retired).all()
    
    # 2. Optimized Fleet ROI using Unified Queries
    # Fetch summarized data per vehicle in single queries where possible
    
    # Revenue/Distance per vehicle
    trip_summary = db.query(
        Trip.vehicle_id,
        func.coalesce(func.sum(Trip.revenue), 0).label("revenue"),
        func.coalesce(func.sum(Trip.actual_distance_km), 0).label("distance")
    ).filter(Trip.status == TripStatus.Completed).group_by(Trip.vehicle_id).all()
    
    trip_map = {t.vehicle_id: t for t in trip_summary}

    # Fuel/Maintenance cost per vehicle
    cost_summary = db.query(
        UnifiedExpense.vehicle_id,
        func.coalesce(func.sum(UnifiedExpense.amount).filter(UnifiedExpense.category == ExpenseCategory.Trip_Fuel), 0).label("fuel"),
        func.coalesce(func.sum(UnifiedExpense.amount).filter(UnifiedExpense.category == ExpenseCategory.Maintenance_Repair), 0).label("maintenance")
    ).group_by(UnifiedExpense.vehicle_id).all()
    
    cost_map = {c.vehicle_id: c for c in cost_summary}

    fleet_roi = []
    fuel_efficiency = []
    vehicle_costs = []

    for vehicle in vehicles:
        t_data = trip_map.get(vehicle.id)
        c_data = cost_map.get(vehicle.id)
        
        revenue = float(t_data.revenue if t_data else 0)
        distance = float(t_data.distance if t_data else 0)
        fuel_cost = float(c_data.fuel if c_data else 0)
        maintenance_cost = float(c_data.maintenance if c_data else 0)
        
        total_cost = fuel_cost + maintenance_cost
        roi = ((revenue - total_cost) / vehicle.acquisition_cost * 100) if vehicle.acquisition_cost > 0 else 0.0
        cost_per_km = total_cost / distance if distance > 0 else 0.0

        fleet_roi.append({
            "vehicle_id": vehicle.id,
            "vehicle_name": vehicle.name,
            "revenue": revenue,
            "total_cost": total_cost,
            "total_distance": distance,
            "cost_per_km": round(cost_per_km, 2),
            "roi": round(roi, 2)
        })

        efficiency = distance / fuel_cost if fuel_cost > 0 else 0.0
        fuel_efficiency.append({
            "vehicle_id": vehicle.id,
            "vehicle_name": vehicle.name,
            "total_distance": distance,
            "total_fuel_cost": fuel_cost,
            "km_per_rupee": round(efficiency, 2)
        })

        vehicle_costs.append(VehicleCost(
            vehicle_id=vehicle.id,
            vehicle_name=vehicle.name,
            total_fuel_cost=fuel_cost,
            total_maintenance_cost=maintenance_cost,
            total_cost=total_cost
        ))

    # 3. Monthly Summary using SQL aggregation
    # Query Trip Monthlies
    trip_months = db.query(
        func.strftime("%Y-%m", Trip.completed_at).label("month"),
        func.coalesce(func.sum(Trip.revenue), 0).label("revenue")
    ).filter(Trip.status == TripStatus.Completed).group_by("month").all()

    # Query Expense Monthlies
    expense_months = db.query(
        func.strftime("%Y-%m", UnifiedExpense.date).label("month"),
        func.coalesce(func.sum(UnifiedExpense.amount).filter(UnifiedExpense.category == ExpenseCategory.Trip_Fuel), 0).label("fuel"),
        func.coalesce(func.sum(UnifiedExpense.amount).filter(UnifiedExpense.category == ExpenseCategory.Maintenance_Repair), 0).label("maintenance")
    ).group_by("month").all()

    monthly_map = {}
    for m in trip_months:
        if m.month: # Guard against null month if completed_at is somehow null on a completed trip
            monthly_map[m.month] = {"revenue": float(m.revenue or 0), "fuel": 0.0, "maintenance": 0.0}
    
    for m in expense_months:
        if m.month:
            if m.month not in monthly_map:
                monthly_map[m.month] = {"revenue": 0.0, "fuel": 0.0, "maintenance": 0.0}
            monthly_map[m.month]["fuel"] = float(m.fuel or 0)
            monthly_map[m.month]["maintenance"] = float(m.maintenance or 0)

    monthly_summary = []
    for month in sorted(monthly_map.keys()):
        data = monthly_map[month]
        monthly_summary.append(MonthlySummary(
            month=month,
            revenue_proxy=data["revenue"],
            fuel_cost=data["fuel"],
            maintenance_cost=data["maintenance"],
            net_profit=data["revenue"] - (data["fuel"] + data["maintenance"])
        ))

    # 4. Dead Stock (Vehicles with no trips in last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    # Get IDs of vehicles with recent trips
    active_vehicle_ids = db.query(Trip.vehicle_id).filter(
        Trip.status == TripStatus.Completed,
        Trip.completed_at >= thirty_days_ago
    ).distinct().all()
    active_vehicle_ids = [v[0] for v in active_vehicle_ids]

    dead_stock = []
    for vehicle in vehicles:
        if vehicle.id not in active_vehicle_ids:
            dead_stock.append({
                "vehicle_id": vehicle.id,
                "vehicle_name": vehicle.name,
                "license_plate": vehicle.license_plate
            })

    vehicle_costs.sort(key=lambda x: x.total_cost, reverse=True)

    return AnalyticsReports(
        total_fuel_cost=float(total_fuel_cost),
        fleet_roi=fleet_roi,
        fuel_efficiency=fuel_efficiency,
        monthly_summary=monthly_summary,
        costliest_vehicles=vehicle_costs[:5],
        dead_stock=dead_stock
    )


@router.get("/export/fleet-roi/csv")
def export_fleet_roi_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vehicles = db.query(Vehicle).filter(Vehicle.status != VehicleStatus.Retired).all()
    
    csv_lines = ["Vehicle ID,Vehicle Name,Revenue,Total Cost,Fuel Cost,Maintenance Cost,Distance (km),Cost per km,ROI (%)"]
    
    for vehicle in vehicles:
        revenue = db.query(func.coalesce(func.sum(Trip.revenue), 0)).filter(
            Trip.vehicle_id == vehicle.id,
            Trip.status == TripStatus.Completed
        ).scalar()
        
        fuel_cost = db.query(func.coalesce(func.sum(Expense.fuel_cost), 0)).filter(
            Expense.vehicle_id == vehicle.id
        ).scalar()
        
        maintenance_cost = db.query(func.coalesce(func.sum(MaintenanceLog.cost), 0)).filter(
            MaintenanceLog.vehicle_id == vehicle.id
        ).scalar()
        
        total_distance = db.query(func.coalesce(func.sum(Trip.actual_distance_km), 0)).filter(
            Trip.vehicle_id == vehicle.id,
            Trip.status == TripStatus.Completed
        ).scalar()
        
        total_cost = float(fuel_cost) + float(maintenance_cost)
        roi = ((float(revenue) - total_cost) / vehicle.acquisition_cost * 100) if vehicle.acquisition_cost > 0 else 0.0
        cost_per_km = total_cost / float(total_distance) if total_distance > 0 else 0.0
        
        csv_lines.append(f"{vehicle.id},{vehicle.name},{revenue:.2f},{total_cost:.2f},{fuel_cost:.2f},{maintenance_cost:.2f},{total_distance:.2f},{cost_per_km:.2f},{roi:.2f}")
    
    return "\n".join(csv_lines)


@router.get("/export/trips/csv")
def export_trips_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trips = db.query(Trip).order_by(Trip.created_at.desc()).all()
    
    csv_lines = ["Trip ID,Vehicle,Driver,Origin,Destination,Cargo (kg),Distance (km),Revenue,Est. Fuel Cost,Act. Fuel Cost,Status,Created,Completed"]
    
    for trip in trips:
        vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
        driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()
        
        csv_lines.append(f"{trip.id},{vehicle.name if vehicle else ''},{driver.name if driver else ''},{trip.origin},{trip.destination},{trip.cargo_weight_kg},{trip.actual_distance_km or trip.estimated_distance_km},{trip.revenue},{trip.estimated_fuel_cost},{trip.actual_fuel_cost or ''},{trip.status.value},{trip.created_at},{trip.completed_at or ''}")
    
    return "\n".join(csv_lines)


@router.get("/export/expenses/csv")
def export_expenses_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expenses = db.query(UnifiedExpense).order_by(UnifiedExpense.date.desc()).all()
    
    csv_lines = ["ID,Date,Category,Source Module,Description,Amount,Vehicle ID,Driver ID,Trip ID"]
    
    for exp in expenses:
        csv_lines.append(f"{exp.id},{exp.date},{exp.category.value if exp.category else ''},{exp.source_module},{exp.description},{exp.amount},{exp.vehicle_id or ''},{exp.driver_id or ''},{exp.trip_id or ''}")
    
    return "\n".join(csv_lines)
