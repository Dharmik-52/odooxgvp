from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from routers import auth, vehicles, drivers, trips, maintenance, expenses, analytics
from seed import seed_database

app = FastAPI(title="FleetFlow API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(vehicles.router, prefix="/api/v1")
app.include_router(drivers.router, prefix="/api/v1")
app.include_router(trips.router, prefix="/api/v1")
app.include_router(maintenance.router, prefix="/api/v1")
app.include_router(expenses.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")


@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    seed_database()


@app.get("/")
def root():
    return {"message": "FleetFlow API is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
