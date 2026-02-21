# Phase 1 Tasks: Foundation & Core Setup

This checklist tracks the actionable tasks required to complete Phase 1 of the FleetFlow implementation plan.

## Backend Dependencies & Configuration
- [ ] Initialize Python virtual environment (`.venv`).
- [ ] Install FastAPI, Uvicorn, SQLAlchemy, Pydantic, python-jose, and passlib.
- [ ] Configure `database.py` to target the local `fleetflow.db` SQLite file.
- [ ] Set up `main.py` with CORS middleware configured to allow requests from `http://localhost:5173`.

## Database Schema Design (models.py & schemas.py)
- [ ] Define SQLAlchemy `Base` class.
- [ ] Create `User` model (id, email, hashed_password, role, is_active).
- [ ] Create Pydantic `UserCreate`, `UserResponse`, and `TokenResponse` schemas.
- [ ] Write the `seed.py` script to generate a default Admin user for initial login.

## Authentication Endpoints (routers/auth.py)
- [ ] Implement password hashing utility functions.
- [ ] Implement JWT token generation function.
- [ ] Create `POST /api/auth/register` endpoint (ensure email uniqueness).
- [ ] Create `POST /api/auth/login` endpoint (verify password, return JWT).
- [ ] Create `get_current_user` dependency to protect subsequent API routes.

## Frontend Initialization & Theming
- [ ] Initialize Vite React project.
- [ ] Install Tailwind CSS, React Router DOM, and Lucide React.
- [ ] Define custom colors (`ff-bg`, `ff-card`, `ff-green`, etc.) in `tailwind.config.js`.
- [ ] Set global body background in `index.css` to match the "Dark Premium" theme.

## Frontend UI Components
- [ ] Build reusable `<Button />` component (variants: primary, secondary, danger).
- [ ] Build reusable `<Input />` component with error state styling.
- [ ] Build reusable `<Card />` container component.
- [ ] Build `<Layout />` wrapper including a Sidebar navigation menu.

## Frontend Authentication Flow
- [ ] Implement `AuthContext.jsx` to store JWT in `localStorage` and manage `currentUser` state.
- [ ] Create `api/axios.js` (or fetch wrapper) that automatically attaches the JWT interceptor.
- [ ] Build `<LoginPage />` component connecting to the backend auth route.
- [ ] Implement `<ProtectedRoute />` component to wrap authenticated routes (Dashboard, Vehicles, etc.).
- [ ] Verify successful login redirection from `/login` to `/dashboard`.
