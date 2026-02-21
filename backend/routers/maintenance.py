from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, case
from typing import Optional, List
from datetime import date, datetime

from database import get_db
from models import MaintenanceLog, Vehicle, UnifiedExpense
from schemas import (
    MaintenanceLogCreate, MaintenanceLogUpdate,
    MaintenanceLogResponse, MaintenanceStatsResponse
)

router = APIRouter(prefix="/maintenance", tags=["maintenance"])


def sync_vehicle_status(vehicle_id: int, db: Session):
    active = db.query(MaintenanceLog).filter(
        MaintenanceLog.vehicle_id == vehicle_id,
        MaintenanceLog.status.in_(["New", "In Progress"])
    ).count()

    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if vehicle:
        if active > 0:
            vehicle.status = "In_Shop"
        else:
            if vehicle.status != "On_Trip":
                vehicle.status = "Available"
        db.commit()
        db.refresh(vehicle)
    return vehicle


def create_maintenance_expense(log: MaintenanceLog, vehicle: Vehicle, db: Session):
    expense = UnifiedExpense(
        category="Maintenance_Repair",
        source_module="Maintenance",
        source_id=log.id,
        description=f"{log.service_type} - {log.issue[:50]} on {vehicle.name}",
        amount=log.cost,
        date=log.service_date,
        vehicle_id=log.vehicle_id,
        driver_id=None,
        trip_id=None
    )
    db.add(expense)
    db.commit()


@router.get("/", response_model=dict)
def get_logs(
    status: Optional[str] = Query(None),
    vehicle_id: Optional[int] = Query(None),
    service_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(MaintenanceLog).options(
        joinedload(MaintenanceLog.vehicle)
    )

    if status:
        query = query.filter(MaintenanceLog.status == status)
    if vehicle_id:
        query = query.filter(MaintenanceLog.vehicle_id == vehicle_id)
    if service_type:
        query = query.filter(MaintenanceLog.service_type == service_type)
    if date_from:
        query = query.filter(MaintenanceLog.service_date >= date_from)
    if date_to:
        query = query.filter(MaintenanceLog.service_date <= date_to)
    if search:
        query = query.join(Vehicle).filter(
            Vehicle.name.ilike(f"%{search}%") |
            Vehicle.license_plate.ilike(f"%{search}%") |
            MaintenanceLog.issue.ilike(f"%{search}%") |
            MaintenanceLog.service_type.ilike(f"%{search}%")
        )

    total = query.count()
    logs = query.order_by(
        MaintenanceLog.created_at.desc()
    ).offset((page - 1) * per_page).limit(per_page).all()

    items = []
    for log in logs:
        days_open = (datetime.utcnow().date() - log.service_date).days
        items.append({
            "id": log.id,
            "vehicle_id": log.vehicle_id,
            "vehicle_name": log.vehicle.name if log.vehicle else "Unknown",
            "license_plate": log.vehicle.license_plate if log.vehicle else "",
            "issue": log.issue,
            "service_type": log.service_type,
            "cost": log.cost,
            "service_date": str(log.service_date),
            "status": log.status,
            "notes": log.notes,
            "days_open": days_open,
            "created_at": str(log.created_at),
            "resolved_at": str(log.resolved_at) if log.resolved_at else None
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page
    }


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    total = db.query(MaintenanceLog).count()
    new_count = db.query(MaintenanceLog).filter(MaintenanceLog.status == "New").count()
    in_prog = db.query(MaintenanceLog).filter(MaintenanceLog.status == "In Progress").count()
    resolved = db.query(MaintenanceLog).filter(MaintenanceLog.status == "Resolved").count()
    total_cost = db.query(func.sum(MaintenanceLog.cost)).scalar() or 0.0
    in_shop = db.query(Vehicle).filter(Vehicle.status == "In_Shop").count()

    common = db.query(
        MaintenanceLog.service_type,
        func.count(MaintenanceLog.service_type).label("cnt")
    ).group_by(MaintenanceLog.service_type).order_by(func.count(
        MaintenanceLog.service_type).desc()
    ).first()

    resolved_logs = db.query(MaintenanceLog).filter(
        MaintenanceLog.status == "Resolved",
        MaintenanceLog.resolved_at != None
    ).all()
    avg_days = 0.0
    if resolved_logs:
        diffs = [
            (r.resolved_at - r.created_at).days
            for r in resolved_logs if r.resolved_at
        ]
        avg_days = round(sum(diffs) / len(diffs), 1) if diffs else 0.0

    in_shop_vehicles = db.query(Vehicle).filter(
        Vehicle.status == "In_Shop"
    ).all()

    return {
        "total_logs": total,
        "new_count": new_count,
        "in_progress_count": in_prog,
        "resolved_count": resolved,
        "total_cost": round(total_cost, 2),
        "vehicles_in_shop": in_shop,
        "most_common_issue": common.service_type if common else "None",
        "avg_resolution_days": avg_days,
        "in_shop_vehicles": [
            {"id": v.id, "name": v.name, "license_plate": v.license_plate}
            for v in in_shop_vehicles
        ]
    }


@router.get("/{log_id}")
def get_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(MaintenanceLog).options(
        joinedload(MaintenanceLog.vehicle)
    ).filter(MaintenanceLog.id == log_id).first()

    if not log:
        raise HTTPException(status_code=404, detail="Log not found")

    days_open = (datetime.utcnow().date() - log.service_date).days
    return {
        "id": log.id,
        "vehicle_id": log.vehicle_id,
        "vehicle_name": log.vehicle.name if log.vehicle else "Unknown",
        "license_plate": log.vehicle.license_plate if log.vehicle else "",
        "issue": log.issue,
        "service_type": log.service_type,
        "cost": log.cost,
        "service_date": str(log.service_date),
        "status": log.status,
        "notes": log.notes,
        "days_open": days_open,
        "created_at": str(log.created_at),
        "resolved_at": str(log.resolved_at) if log.resolved_at else None
    }


@router.post("/", status_code=201)
def create_log(data: MaintenanceLogCreate, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == data.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    log = MaintenanceLog(
        vehicle_id=data.vehicle_id,
        issue=data.issue,
        service_type=data.service_type,
        cost=data.cost,
        service_date=data.service_date,
        notes=data.notes,
        status="New",
        created_at=datetime.utcnow()
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    vehicle.status = "In_Shop"
    db.commit()

    try:
        create_maintenance_expense(log, vehicle, db)
    except Exception as e:
        print(f"Expense auto-create failed: {e}")

    return {
        "id": log.id,
        "vehicle_id": log.vehicle_id,
        "vehicle_name": vehicle.name,
        "license_plate": vehicle.license_plate,
        "issue": log.issue,
        "service_type": log.service_type,
        "cost": log.cost,
        "service_date": str(log.service_date),
        "status": log.status,
        "notes": log.notes,
        "days_open": 0,
        "created_at": str(log.created_at),
        "resolved_at": None,
        "vehicle_status_changed": True,
        "new_vehicle_status": "In_Shop"
    }


@router.put("/{log_id}")
def update_log(
    log_id: int,
    data: MaintenanceLogUpdate,
    db: Session = Depends(get_db)
):
    log = db.query(MaintenanceLog).filter(
        MaintenanceLog.id == log_id
    ).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")

    if data.issue is not None:
        log.issue = data.issue
    if data.service_type is not None:
        log.service_type = data.service_type
    if data.cost is not None:
        log.cost = data.cost
    if data.service_date is not None:
        log.service_date = data.service_date
    if data.notes is not None:
        log.notes = data.notes
    if data.status is not None:
        log.status = data.status
        if data.status == "Resolved" and not log.resolved_at:
            log.resolved_at = datetime.utcnow()

    db.commit()
    db.refresh(log)

    vehicle = sync_vehicle_status(log.vehicle_id, db)

    days_open = (datetime.utcnow().date() - log.service_date).days
    return {
        "id": log.id,
        "vehicle_id": log.vehicle_id,
        "vehicle_name": vehicle.name if vehicle else "Unknown",
        "license_plate": vehicle.license_plate if vehicle else "",
        "issue": log.issue,
        "service_type": log.service_type,
        "cost": log.cost,
        "service_date": str(log.service_date),
        "status": log.status,
        "notes": log.notes,
        "days_open": days_open,
        "created_at": str(log.created_at),
        "resolved_at": str(log.resolved_at) if log.resolved_at else None,
        "new_vehicle_status": vehicle.status if vehicle else None
    }


@router.patch("/{log_id}/resolve")
def resolve_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(MaintenanceLog).filter(
        MaintenanceLog.id == log_id
    ).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    if log.status == "Resolved":
        raise HTTPException(status_code=400, detail="Already resolved")

    log.status = "Resolved"
    log.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(log)

    vehicle = sync_vehicle_status(log.vehicle_id, db)

    return {
        "id": log.id,
        "status": "Resolved",
        "resolved_at": str(log.resolved_at),
        "vehicle_name": vehicle.name if vehicle else "Unknown",
        "new_vehicle_status": vehicle.status if vehicle else "Unknown",
        "vehicle_available": vehicle.status == "Available" if vehicle else False
    }


@router.delete("/{log_id}")
def delete_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(MaintenanceLog).filter(
        MaintenanceLog.id == log_id
    ).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    if log.status in ["In Progress", "Resolved"]:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete an active or resolved service log"
        )

    vehicle_id = log.vehicle_id
    db.delete(log)
    db.commit()

    sync_vehicle_status(vehicle_id, db)

    return {"message": "Log deleted successfully"}
