from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_, cast, String
from typing import Optional, List
from datetime import date

from database import get_db
from models import User, UnifiedExpense, Vehicle, Driver, ExpenseCategory
from schemas import UnifiedExpenseCreate, UnifiedExpenseResponse, UnifiedExpensePaginatedResponse, ExpenseSummary, ExpenseByCategory, ExpenseByVehicle, ExpenseByMonth
from auth import get_current_user

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.get("/", response_model=UnifiedExpensePaginatedResponse)
def get_expenses(
    search: Optional[str] = None,
    category: Optional[str] = None,
    source_module: Optional[str] = None,
    vehicle_id: Optional[int] = None,
    driver_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    amount_min: Optional[float] = None,
    amount_max: Optional[float] = None,
    sort_by: Optional[str] = "date",
    sort_order: Optional[str] = "desc",
    page: int = 1,
    per_page: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(UnifiedExpense).outerjoin(Vehicle, UnifiedExpense.vehicle_id == Vehicle.id).outerjoin(Driver, UnifiedExpense.driver_id == Driver.id)
    
    if search:
        query = query.filter(or_(
            UnifiedExpense.description.ilike(f"%{search}%"),
            Vehicle.name.ilike(f"%{search}%"),
            Driver.name.ilike(f"%{search}%"),
            UnifiedExpense.source_module.ilike(f"%{search}%"),
            cast(UnifiedExpense.trip_id, String).ilike(f"%{search}%")
        ))
    
    if category:
        categories_list = category.split(",")
        query = query.filter(UnifiedExpense.category.in_(categories_list))
    
    if source_module:
        sources_list = source_module.split(",")
        query = query.filter(UnifiedExpense.source_module.in_(sources_list))
    
    if vehicle_id:
        query = query.filter(UnifiedExpense.vehicle_id == vehicle_id)
    if driver_id:
        query = query.filter(UnifiedExpense.driver_id == driver_id)
    if date_from:
        query = query.filter(UnifiedExpense.date >= date_from)
    if date_to:
        query = query.filter(UnifiedExpense.date <= date_to)
    if amount_min is not None:
        query = query.filter(UnifiedExpense.amount >= amount_min)
    if amount_max is not None:
        query = query.filter(UnifiedExpense.amount <= amount_max)
    
    total = query.count()
    total_pages = (total + per_page - 1) // per_page
    
    sort_column = UnifiedExpense.date
    if sort_by == "amount":
        sort_column = UnifiedExpense.amount
    elif sort_by == "category":
        sort_column = UnifiedExpense.category
    elif sort_by == "source_module":
        sort_column = UnifiedExpense.source_module
    
    if sort_order == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())
    
    offset = (page - 1) * per_page
    items = query.offset(offset).limit(per_page).all()
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }


@router.get("/categories")
def get_expense_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    results = db.query(
        UnifiedExpense.category,
        func.count(UnifiedExpense.id).label("count"),
        func.sum(UnifiedExpense.amount).label("total_amount")
    ).group_by(UnifiedExpense.category).all()
    
    return [
        {
            "category": cat.value if hasattr(cat, 'value') else cat,
            "count": count,
            "total_amount": float(total_amount) if total_amount else 0.0
        }
        for cat, count, total_amount in results
    ]


@router.get("/summary", response_model=ExpenseSummary)
def get_expenses_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total = db.query(func.coalesce(func.sum(UnifiedExpense.amount), 0)).scalar()
    
    by_category_raw = db.query(
        UnifiedExpense.category,
        func.sum(UnifiedExpense.amount)
    ).group_by(UnifiedExpense.category).all()
    
    by_category = [
        ExpenseByCategory(category=cat.value, total=float(tot)) 
        for cat, tot in by_category_raw
    ]
    
    by_vehicle_raw = db.query(
        UnifiedExpense.vehicle_id,
        Vehicle.name,
        func.sum(UnifiedExpense.amount)
    ).join(Vehicle, UnifiedExpense.vehicle_id == Vehicle.id).group_by(
        UnifiedExpense.vehicle_id, Vehicle.name
    ).all()
    
    by_vehicle = [
        ExpenseByVehicle(vehicle_id=vid, vehicle_name=name, total_cost=float(cost))
        for vid, name, cost in by_vehicle_raw if vid
    ]
    
    by_month_raw = db.query(
        func.strftime('%Y-%m', UnifiedExpense.date),
        func.sum(UnifiedExpense.amount)
    ).group_by(func.strftime('%Y-%m', UnifiedExpense.date)).order_by(
        func.strftime('%Y-%m', UnifiedExpense.date).desc()
    ).limit(12).all()
    
    by_month = [
        ExpenseByMonth(month=month, total=float(total))
        for month, total in by_month_raw
    ]
    
    return ExpenseSummary(
        total=float(total),
        by_category=by_category,
        by_vehicle=by_vehicle,
        by_month=by_month
    )


@router.post("/", response_model=UnifiedExpenseResponse)
def create_expense(
    expense_data: UnifiedExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense = UnifiedExpense(
        category=ExpenseCategory.Miscellaneous,
        source_module="Manual",
        description=expense_data.description,
        amount=expense_data.amount,
        date=expense_data.date,
        vehicle_id=expense_data.vehicle_id,
        driver_id=expense_data.driver_id,
        note=expense_data.note
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/{expense_id}")
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense = db.query(UnifiedExpense).filter(UnifiedExpense.id == expense_id).first()
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    
    if expense.source_module != "Manual":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Auto-generated expenses cannot be deleted"
        )
    
    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted successfully"}


@router.get("/vehicle/{vehicle_id}")
def get_vehicle_expenses(
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
    
    total = db.query(func.coalesce(func.sum(UnifiedExpense.amount), 0)).filter(
        UnifiedExpense.vehicle_id == vehicle_id
    ).scalar()
    
    return {
        "vehicle_id": vehicle_id,
        "vehicle_name": vehicle.name,
        "total_cost": float(total)
    }
