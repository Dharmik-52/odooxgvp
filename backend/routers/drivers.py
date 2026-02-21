from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date

from database import get_db
from models import User, Driver, DutyStatus, UnifiedExpense, ExpenseCategory
from schemas import DriverCreate, DriverUpdate, DriverResponse
from auth import get_current_user

router = APIRouter(prefix="/drivers", tags=["drivers"])


def check_and_suspend_drivers(db: Session):
    today = date.today()
    drivers = db.query(Driver).all()
    for driver in drivers:
        if driver.license_expiry < today and driver.duty_status != DutyStatus.Suspended:
            driver.duty_status = DutyStatus.Suspended
    db.commit()


@router.get("/", response_model=List[DriverResponse])
def get_drivers(
    duty_status: Optional[DutyStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_and_suspend_drivers(db)

    query = db.query(Driver)
    if duty_status:
        query = query.filter(Driver.duty_status == duty_status)
    return query.all()


@router.get("/{driver_id}", response_model=DriverResponse)
def get_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_and_suspend_drivers(db)

    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found"
        )

    if driver.license_expiry < date.today() and driver.duty_status != DutyStatus.Suspended:
        driver.duty_status = DutyStatus.Suspended
        db.commit()
        db.refresh(driver)

    return driver


@router.post("/", response_model=DriverResponse)
def create_driver(
    driver_data: DriverCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Driver).filter(Driver.license_number == driver_data.license_number).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="License number already exists"
        )

    driver = Driver(**driver_data.model_dump())

    if driver.license_expiry < date.today():
        driver.duty_status = DutyStatus.Suspended

    db.add(driver)
    db.commit()
    db.refresh(driver)

    expense = UnifiedExpense(
        category=ExpenseCategory.Driver_Compliance,
        source_module="Drivers",
        source_id=driver.id,
        description=f"Driver onboarding: {driver.name}",
        amount=0,
        date=date.today(),
        driver_id=driver.id
    )
    db.add(expense)
    db.commit()

    return driver


@router.put("/{driver_id}", response_model=DriverResponse)
def update_driver(
    driver_id: int,
    driver_data: DriverUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found"
        )

    update_data = driver_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(driver, field, value)

    if driver.license_expiry < date.today():
        driver.duty_status = DutyStatus.Suspended

    db.commit()
    db.refresh(driver)
    return driver


@router.delete("/{driver_id}")
def delete_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found"
        )

    db.delete(driver)
    db.commit()
    return {"message": "Driver deleted successfully"}
