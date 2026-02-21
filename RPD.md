# Ralph Loop Prompt Document (RPD) - FleetFlow

This document serves as the system prompt and operational guide for the Ralph Loop extension (or any autonomous agent) operating within the FleetFlow project.

## Project Context
**FleetFlow** is a comprehensive, full-stack fleet management application designed to track vehicles, dispatch trips, monitor driver compliance, manage maintenance logs, and calculate operational expenses.

### Tech Stack
-   **Backend:** Python, FastAPI, SQLAlchemy, SQLite (`fleetflow.db`)
-   **Frontend:** React 18, Vite, React Router DOM, Tailwind CSS, Recharts for analytics, Lucide React for icons.
-   **Architecture:** Monorepo style separated into `/backend` and `/frontend` directories. Authentication utilizes local storage for JWT tokens and relies heavily on Context (`AuthContext.jsx`) for role-based route protection.

## Operational Directives

When operating on this codebase, adhere to the following rules:

### 1. Codebase Navigation & Modification
-   **Backend Changes:** All FastAPI endpoints should be modular and located inside `backend/routers/`. Database models (`Base`) are in `backend/models.py`. Pydantic schemas for data validation reside in `backend/schemas.py`.
-   **Frontend Changes:** Components should be placed in `frontend/src/components/`, pages in `frontend/src/pages/`, and API calls should be abstracted in `frontend/src/api/`.
-   **Styling:** Use Tailwind CSS exclusively. The project follows a "Dark Premium" visual theme utilizing custom colors defined in `tailwind.config.js` (e.g., `ff-bg`, `ff-card`, `ff-green`). Avoid writing custom CSS in `.css` files unless absolutely necessary for complex animations.

### 2. Execution & Testing
-   **Running the Backend:** Execute `python -m uvicorn main:app --reload` from within the `/backend` directory. The API will be available at `http://127.0.0.1:8000`.
-   **Running the Frontend:** Execute `npm run dev` from within the `/frontend` directory. The web app usually binds to port `5173` or `5174`.
-   **Database Seeding:** If schema changes are modeled, run `python seed.py --drop` inside `/backend` to recreate the schema and re-seed the test database to avoid `OperationalError` conflicts.

### 3. Loop Execution Strategy
-   Before making structural layout changes to the frontend Sidebar or Protected Routes, ensure that you fully comprehend the role-handling logic located in `AuthContext.jsx`.
-   Always verify that new backend routes are correctly registered in `main.py`.
-   When debugging `500 Internal Server Errors`, prioritize checking `models.py` schema alignment with `schemas.py` response models.
-   Provide concise, actionable summaries after completing a loop iteration, explicitly detailing which files were modified and what services (if any) need a restart.

## Initial Task Prompt for Ralph Loop
*Trigger the Ralph Loop extension with the following prompt when beginning a new feature sprint:*

> "You are an expert full-stack developer assisting with the FleetFlow application. Review the `RPD.md` file for architectural constraints. Your goal is to autonomously build, integrate, and verify new features while strictly adhering to the FastAPI backend structure and the React/Tailwind frontend design system. Before writing new code, analyze existing `models.py` and front-end contexts. Always ensure the development servers compile successfully without errors before completing a loop."
