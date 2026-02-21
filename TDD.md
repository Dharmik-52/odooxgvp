# Technical Design Document (TDD) - FleetFlow

## 1. System Architecture
FleetFlow is built on a decoupled client-server architecture, enabling independent scaling and development lifecycles for the frontend and backend.

### 1.1 High-Level Diagram
[React SPA (Frontend)] <--- HTTPS/REST ---> [FastAPI (Backend)] <---> [SQLite (Database)]

## 2. Backend Design (Python / FastAPI)

### 2.1 Framework & Core Libraries
- **Web Framework:** FastAPI for high-performance, asynchronous REST APIs.
- **ORM:** SQLAlchemy for database interactions and schema management.
- **Data Validation:** Pydantic for defining request and response schemas.
- **Authentication:** `python-jose` for JWT generation/verification, `passlib` for password hashing.

### 2.2 Directory Structure (`/backend`)
- `/routers/`: Contains modular API route definitions grouped by domain (e.g., `vehicles.py`, `trips.py`, `auth.py`).
- `/models.py`: SQLAlchemy declarative base classes defining database tables.
- `/schemas.py`: Pydantic models for data validation and API contract enforcement.
- `/database.py`: Database connection setup and session management (`get_db` dependency).
- `/main.py`: Application entry point, CORS configuration, and route inclusion.
- `/seed.py`: Utility script for dropping tables and populating mock data for development.

### 2.3 Database Schema (SQLite)
The relational database (`fleetflow.db`) relies on the following core entities:
- **User:** Stores authentication credentials and role (Admin, Dispatcher, Manager).
- **Vehicle:** Stores vehicle metadata (Make, Model, VIN, Status).
- **Driver:** Stores driver details (Name, License, Compliance Status).
- **Trip:** Links a Vehicle and a Driver to a specific route and schedule.
- **Expense:** Links to a Vehicle or Trip to track financial outflows.
- **MaintenanceLog:** Links to a Vehicle to track repair history.

## 3. Frontend Design (React / Vite)

### 3.1 Framework & Core Libraries
- **Core:** React 18, Vite (for fast HMR and optimized builds).
- **Routing:** React Router DOM (v6) for client-side navigation.
- **Styling:** Tailwind CSS.
- **Icons:** Lucide React.
- **Charting:** Recharts for the Analytics Dashboard.

### 3.2 Directory Structure (`/frontend/src`)
- `/components/`: Reusable, stateless UI components (e.g., `Button`, `Card`, `Modal`, `Sidebar`).
- `/pages/`: Stateful container components representing views (e.g., `Dashboard`, `VehiclesList`, `LoginPage`).
- `/context/`: React Context providers. Specifically, `AuthContext.jsx` manages the JWT token, user state, and login/logout functions.
- `/api/`: Axios instances or Fetch wrappers abstracting backend API calls.
- `/hooks/`: Custom React hooks for shared logic.
- `/assets/`: Static assets (images, global CSS overrides).

### 3.3 State Management & Authentication Flow
1. User submits credentials on `/login`.
2. Frontend calls `/api/auth/login`.
3. Backend verifies credentials and returns a JWT.
4. `AuthContext` stores the JWT in `localStorage` and updates the application state.
5. React Router's `ProtectedRoute` wrapper allows access to internal pages.
6. Subsequent API calls include the JWT in the `Authorization: Bearer <token>` header.

### 3.4 Styling Guidelines ("Dark Premium")
- Utilize a dark color palette as the foundation (`ff-bg`, `ff-card`).
- Use subtle neon or vibrant accents (e.g., `ff-green` for active states, red for errors) to guide user attention.
- Ensure all components are responsive, though desktop layouts are prioritized for management functions.
- Avoid inline styles; leverage Tailwind utility classes strictly.

## 4. API Contract Examples

### GET `/api/vehicles/{vehicle_id}`
**Response:**
```json
{
  "id": 1,
  "make": "Ford",
  "model": "Transit",
  "year": 2022,
  "status": "Active",
  "mileage": 45000
}
```

### POST `/api/trips`
**Request Payload:**
```json
{
  "vehicle_id": 1,
  "driver_id": 3,
  "origin": "Warehouse A",
  "destination": "Client Hub X",
  "scheduled_departure": "2023-11-01T08:00:00Z"
}
```

## 5. Deployment Strategy
- **Backend:** Gunicorn with Uvicorn workers, hosted on a cloud provider (e.g., Render, AWS EC2, or Heroku).
- **Frontend:** Static output (`dist/` folder built via Vite) served via a CDN (e.g., Vercel, Netlify, or AWS CloudFront).
- **Database:** Migrate from SQLite to PostgreSQL for production environments to support higher concurrency and robust data integrity.
