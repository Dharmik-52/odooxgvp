from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta, date

from database import get_db
from models import (
    Notification, NotificationType, User, Vehicle, Driver,
    Trip, MaintenanceLog, VehicleStatus, TripStatus
)
from schemas import NotificationResponse, NotificationCountResponse
from auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )


@router.get("/unread-count", response_model=NotificationCountResponse)
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    count = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        )
        .count()
    )
    return NotificationCountResponse(unread_count=count)


@router.patch("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        )
        .first()
    )
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    return {"message": "Marked as read"}


@router.patch("/read-all")
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}


@router.post("/generate")
def generate_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Scan real system data and create actionable notifications for the current user."""
    created = 0

    def _add(title: str, message: str, ntype: NotificationType):
        nonlocal created
        exists = (
            db.query(Notification)
            .filter(
                Notification.user_id == current_user.id,
                Notification.title == title,
                Notification.message == message,
            )
            .first()
        )
        if not exists:
            db.add(Notification(
                user_id=current_user.id,
                title=title,
                message=message,
                type=ntype,
            ))
            created += 1

    # 1. Vehicles in maintenance
    in_shop = db.query(Vehicle).filter(Vehicle.status == VehicleStatus.In_Shop).all()
    for v in in_shop:
        _add(
            "Vehicle in Maintenance",
            f"{v.name} ({v.license_plate}) is currently in the shop.",
            NotificationType.warning,
        )

    # 2. Driver licenses expiring within 30 days
    soon = date.today() + timedelta(days=30)
    expiring = db.query(Driver).filter(Driver.license_expiry <= soon).all()
    for d in expiring:
        days_left = (d.license_expiry - date.today()).days
        label = "expired" if days_left < 0 else f"expiring in {days_left} days"
        _add(
            "License Expiry Alert",
            f"Driver {d.name} — license {label} ({d.license_expiry}).",
            NotificationType.alert,
        )

    # 3. Draft trips pending dispatch
    drafts = db.query(Trip).filter(Trip.status == TripStatus.Draft).all()
    for t in drafts:
        _add(
            "Trip Pending Dispatch",
            f"Trip #{t.id} ({t.origin} → {t.destination}) is still in draft.",
            NotificationType.info,
        )

    # 4. Open maintenance logs (New status)
    open_logs = (
        db.query(MaintenanceLog)
        .filter(MaintenanceLog.status == "New")
        .all()
    )
    for log in open_logs:
        vehicle = db.query(Vehicle).filter(Vehicle.id == log.vehicle_id).first()
        vname = vehicle.name if vehicle else f"Vehicle #{log.vehicle_id}"
        _add(
            "New Maintenance Report",
            f"{vname}: {log.issue} — reported on {log.service_date}.",
            NotificationType.warning,
        )

    # 5. Recently completed trips (success notifications)
    yesterday = datetime.utcnow() - timedelta(days=1)
    recent_completed = (
        db.query(Trip)
        .filter(Trip.status == TripStatus.Completed, Trip.completed_at >= yesterday)
        .all()
    )
    for t in recent_completed:
        _add(
            "Trip Completed",
            f"Trip #{t.id} ({t.origin} → {t.destination}) completed successfully.",
            NotificationType.success,
        )

    db.commit()
    return {"message": f"{created} new notification(s) generated."}
