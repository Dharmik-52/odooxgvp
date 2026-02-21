# Context Database (CDB) - FleetFlow

## 1. Project Context & Philosophy
FleetFlow is designed to replace fragmented, spreadsheet-based fleet management solutions with a centralized, high-performance web application. The core philosophy is "Data Visibility at a Glance"—ensuring that fleet managers can instantly assess system health, operational bottlenecks, and financial metrics without digging through complex reports.

## 2. Architectural Constraints
- **Strict Monorepo Separation:** The application is strictly divided into `/frontend` (React/Vite) and `/backend` (Python/FastAPI). These two halves must only communicate via REST APIs over HTTP.
- **No SSR:** The frontend is a pure Single Page Application (SPA). Server-Side Rendering (e.g., Next.js) is not utilized in this architecture.
- **Relational Integrity:** The backend heavily relies on SQLAlchemy ORM to maintain strict relational integrity (Foreign Keys, Cascades) between Vehicles, Drivers, Trips, and Expenses.

## 3. Thematic & Design Language
- **Theme Name:** "Dark Premium"
- **Color Palette:**
  - Background: Deep gray/black (`#121212` or similar Tailwind custom colors like `bg-ff-bg`).
  - Cards/Surfaces: Slightly lighter elevated surfaces (`bg-ff-card`).
  - Primary Accent: Electric/Neon Green (`text-ff-green`, `bg-ff-green`) representing active/healthy status.
  - Secondary Accents: Amber/Yellow for warnings (maintenance due), Red/Crimson for critical errors (out of service).
- **Typography:** Clean, sans-serif fonts (e.g., Inter or Roboto). High legibility is critical for data-dense tables.
- **Component Style:** Slight border radii, subtle drop shadows on cards to create depth against the dark background. Minimalist icons (Lucide React).

## 4. State Management Nuances
- **AuthContext:** Authentication is the absolute source of truth for routing. If a user's JWT expires or is invalid, all protected routes must immediately redirect to `/login` without exposing sensitive data.
- **Local State vs. Global State:** Avoid Redux for this phase of the project. Use local component state (`useState`) for UI toggles and form inputs. Use React Query (if integrated later) or standard `useEffect` hooks for remote API data fetching.

## 5. Development Workflow Guidelines
- **Database Migrations:** Currently handled by dropping and recreating tables via `seed.py`. When making schema changes in `models.py`, you MUST update `schemas.py` to match, and then run `python seed.py --drop` to apply changes to `fleetflow.db`.
- **API First:** When building a new feature, always implement and test the backend FastAPI route (using Swagger UI at `http://127.0.0.1:8000/docs`) before building the frontend React component.
- **Console Errors:** The React development environment must be kept free of React key warnings and unhandled promise rejections.
