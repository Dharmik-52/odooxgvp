# FleetFlow - Fleet & Logistics Management

FleetFlow is a comprehensive, full-stack fleet management application designed to track vehicles, dispatch trips, monitor driver compliance, manage maintenance logs, and calculate operational expenses.

## Project Structure
This repository is organized as a monorepo containing both the frontend and backend applications.
- `/backend`: Python FastAPI server with SQLite/SQLAlchemy.
- `/frontend`: React 18 SPA built with Vite and Tailwind CSS.

## Features
- **Vehicle Tracking**: Real-time monitoring and status updates (Active, Maintenance, Out of Service).
- **Trip Dispatching**: Assign drivers and vehicles; track trip lifecycle (Scheduled, In Progress, Completed).
- **Driver Compliance**: Monitor driver HOS (Hours of Service) and license status.
- **Maintenance Logs**: Track routine checks, unexpected repairs, and costs.
- **Expense Tracking**: Calculate cost-per-mile from fuel, maintenance, and operational expenses.

## Tech Stack
### Backend
- **Python 3.10+**
- **FastAPI** (High-performance async routing)
- **SQLAlchemy** (ORM)
- **SQLite** (Database - Development)
- **Pydantic** (Validation)
- **python-jose / passlib** (JWT Authentication)

### Frontend
- **React 18**
- **Vite** (Build tool)
- **Tailwind CSS** ("Dark Premium" Theme)
- **React Router DOM v6**
- **Recharts** (Analytics dashboards)
- **Lucide React** (Icons)

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### 1. Backend Setup
Navigate to the backend directory and set up your Python environment:
```bash
cd backend
python -m venv .venv

# Activate virtual environment
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database seed (Optional: Drops and recreates the database with test data)
python seed.py --drop

# Start the FastAPI server
python -m uvicorn main:app --reload
```
The API will be available at `http://localhost:8000`. You can view the interactive Swagger API documentation at `http://localhost:8000/docs`.

### 2. Frontend Setup
Open a new terminal, navigate to the frontend directory, and start the development server:
```bash
cd frontend

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```
The web application will be available at `http://localhost:5173`.

## Documentation
Additional project documentation can be found in the root directory:
- `PRD.md` - Product Requirements Document
- `TDD.md` - Technical Design Document
- `CDB.md` - Context Database (Design constraints & architecture)
- `RPD.md` - Ralph Loop Prompt Document (AI System Prompts)

## License
MIT License
