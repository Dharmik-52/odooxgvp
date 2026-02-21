from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import date, datetime
from typing import Optional, List
from models import UserRole, VehicleType, VehicleStatus, DutyStatus, TripStatus, MaintenanceStatus, ExpenseCategory


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: UserRole


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: Optional[str] = None


class UserRegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: UserRole


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    full_name: str
    email: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: Optional[str] = None
    email: str
    role: UserRole
    is_active: bool
    created_at: datetime


class VehicleBase(BaseModel):
    name: str
    license_plate: str
    type: VehicleType
    max_capacity_kg: float
    odometer_km: float = 0.0
    acquisition_cost: float = 0.0
    model: Optional[str] = None


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    name: Optional[str] = None
    license_plate: Optional[str] = None
    type: Optional[VehicleType] = None
    max_capacity_kg: Optional[float] = None
    odometer_km: Optional[float] = None
    acquisition_cost: Optional[float] = None
    model: Optional[str] = None


class VehicleResponse(VehicleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: VehicleStatus
    created_at: datetime


class DriverBase(BaseModel):
    name: str
    license_number: str
    license_expiry: date
    user_id: Optional[int] = None


class DriverCreate(DriverBase):
    pass


class DriverUpdate(BaseModel):
    name: Optional[str] = None
    license_number: Optional[str] = None
    license_expiry: Optional[date] = None
    completion_rate: Optional[float] = None
    safety_score: Optional[float] = None
    duty_status: Optional[DutyStatus] = None


class DriverResponse(DriverBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    completion_rate: float
    safety_score: float
    duty_status: DutyStatus
    created_at: datetime


class TripBase(BaseModel):
    vehicle_id: int
    driver_id: int
    cargo_weight_kg: float
    origin: str
    destination: str
    estimated_fuel_cost: float = 0.0


class TripCreate(TripBase):
    pass


class TripUpdate(BaseModel):
    cargo_weight_kg: Optional[float] = None
    origin: Optional[str] = None
    destination: Optional[str] = None
    estimated_fuel_cost: Optional[float] = None
    actual_fuel_cost: Optional[float] = None
    final_odometer: Optional[float] = None


class TripStatusUpdate(BaseModel):
    status: TripStatus
    final_odometer: Optional[float] = None
    actual_fuel_cost: Optional[float] = None


class VehicleNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    license_plate: str
    type: VehicleType


class DriverNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    license_number: str


class TripResponse(TripBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: TripStatus
    actual_fuel_cost: Optional[float] = None
    final_odometer: Optional[float] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    vehicle: Optional[VehicleNested] = None
    driver: Optional[DriverNested] = None


class MaintenanceLogBase(BaseModel):
    vehicle_id: int
    issue: str
    service_date: date
    cost: float


class MaintenanceLogCreate(MaintenanceLogBase):
    pass


class MaintenanceLogUpdate(BaseModel):
    issue: Optional[str] = None
    service_date: Optional[date] = None
    cost: Optional[float] = None
    status: Optional[MaintenanceStatus] = None


class MaintenanceLogResponse(MaintenanceLogBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: MaintenanceStatus
    created_at: datetime
    vehicle: Optional[VehicleNested] = None


class ExpenseBase(BaseModel):
    trip_id: Optional[int] = None
    driver_id: int
    vehicle_id: Optional[int] = None
    fuel_cost: float = 0.0
    misc_cost: float = 0.0
    distance_km: float = 0.0


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseResponse(ExpenseBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    trip: Optional[TripResponse] = None
    driver: Optional[DriverNested] = None


class DashboardStats(BaseModel):
    active_fleet: int
    maintenance_alerts: int
    utilization_rate: float
    pending_cargo: int
    recent_trips: List[TripResponse]


class MonthlySummary(BaseModel):
    month: str
    revenue_proxy: float
    fuel_cost: float
    maintenance_cost: float
    net_profit: float


class VehicleCost(BaseModel):
    vehicle_id: int
    vehicle_name: str
    total_fuel_cost: float
    total_maintenance_cost: float
    total_cost: float


class AnalyticsReports(BaseModel):
    total_fuel_cost: float
    fleet_roi: List[dict]
    fuel_efficiency: List[dict]
    monthly_summary: List[MonthlySummary]
    costliest_vehicles: List[VehicleCost]
    dead_stock: List[dict]


class UnifiedExpenseBase(BaseModel):
    category: ExpenseCategory
    source_module: str
    source_id: Optional[int] = None
    description: str
    amount: float
    date: date
    vehicle_id: Optional[int] = None
    driver_id: Optional[int] = None
    trip_id: Optional[int] = None
    maintenance_id: Optional[int] = None
    note: Optional[str] = None


class UnifiedExpenseCreate(BaseModel):
    description: str
    amount: float
    date: date
    vehicle_id: Optional[int] = None
    driver_id: Optional[int] = None
    note: Optional[str] = None


class UnifiedExpenseResponse(UnifiedExpenseBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class UnifiedExpensePaginatedResponse(BaseModel):
    items: List[UnifiedExpenseResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


class ExpenseByCategory(BaseModel):
    category: str
    total: float


class ExpenseByVehicle(BaseModel):
    vehicle_id: int
    vehicle_name: str
    total_cost: float


class ExpenseByMonth(BaseModel):
    month: str
    total: float


class ExpenseSummary(BaseModel):
    total: float
    by_category: List[ExpenseByCategory]
    by_vehicle: List[ExpenseByVehicle]
    by_month: List[ExpenseByMonth]
