from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import uvicorn

from database import engine, Base
from routers import auth, vehicles, drivers, trips, maintenance, expenses, analytics, notifications
from seed import seed_database
from sentry_setup import init_sentry

# Initialize Sentry before app creation
init_sentry()

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="FleetFlow API", version="1.0.0")

app.state.limiter = limiter

def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return {"error": "Rate limit exceeded", "detail": str(exc)}

app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
app.include_router(notifications.router, prefix="/api/v1")


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


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
