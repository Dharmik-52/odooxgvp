# Product Requirements Document (PRD) - FleetFlow

## 1. Executive Summary
FleetFlow is a comprehensive, full-stack fleet management and logistics platform designed to streamline operations for transportation companies. The application aims to centralize vehicle tracking, trip dispatching, driver compliance, maintenance scheduling, and operational expense calculations into a single, cohesive "Dark Premium" interface.

## 2. Target Audience & User Personas
### 2.1 Fleet Managers
- **Goals:** Oversee entire fleet operations, monitor vehicle health, analyze operational costs, and ensure maximum efficiency and profitability.
- **Needs:** High-level dashboard with KPIs, aggregated expense reports, and alerts for critical maintenance or compliance issues.

### 2.2 Dispatchers
- **Goals:** Efficiently assign drivers and vehicles to upcoming trips, monitor live trip status, and handle scheduling conflicts.
- **Needs:** Intuitive trip management interface, real-time availability status of vehicles and drivers.

### 2.3 System Administrators
- **Goals:** Manage user roles, configure system-wide settings, and ensure data security and integrity.
- **Needs:** Role-based access control (RBAC) management, system audit logs, and secure authentication flows.

## 3. Core Features & Requirements

### 3.1 Vehicle Tracking & Management
- **Inventory Management:** Add, update, and remove vehicles from the fleet. Store details like VIN, make, model, year, license plate, and current status (Active, Maintenance, Out of Service).
- **Status Monitoring:** Real-time visibility into vehicle availability to prevent double-booking.

### 3.2 Trip Dispatching
- **Trip Creation:** Define origin, destination, scheduled departure/arrival times, and calculate estimated distance.
- **Assignment:** Assign an available driver and a suitable vehicle to a specific trip.
- **Status Tracking:** Track trip lifecycle (Scheduled, In Progress, Completed, Cancelled).

### 3.3 Driver Compliance & Management
- **Driver Profiles:** Maintain detailed records of drivers, including license numbers, expiration dates, and contact information.
- **Hours of Service (HOS) Tracking:** Monitor driver working hours to ensure compliance with legal regulations.
- **Performance Metrics:** Track successful trips, safety incidents, and overall reliability.

### 3.4 Maintenance Logs
- **Preventative Maintenance:** Schedule routine checks based on mileage or time intervals (e.g., oil changes, tire rotations).
- **Repair Logging:** Record unexpected breakdowns, repair costs, and downtime.
- **Alerts:** Notify managers when vehicles require servicing based on predefined thresholds.

### 3.5 Expense Tracking & Analytics
- **Cost Logging:** Record fuel purchases, tolls, maintenance costs, and other operational expenses per trip or per vehicle.
- **Financial Analytics:** Generate visual charts (using Recharts) to analyze cost per mile, total expenses over time, and profitability.
- **Dashboard Summary:** A centralized view featuring critical metrics (Total Vehicles, Active Trips, Pending Maintenance, Total Expenses).

## 4. Non-Functional Requirements
- **Performance:** The frontend SPA (React/Vite) must load initial assets under 1.5 seconds. API responses should resolve within 200ms.
- **Security:** All endpoints handling sensitive data must be protected via JWT authentication. Passwords must be hashed using bcrypt.
- **Usability:** The interface must strictly adhere to the "Dark Premium" design language, ensuring high contrast, accessibility, and an intuitive user experience on desktop screens.
- **Scalability:** The FastAPI backend must be capable of handling concurrent requests from multiple dispatchers simultaneously.

## 5. Future Roadmap (Post-V1)
- GPS integration for real-time location tracking on a live map.
- Automated email/SMS notifications for drivers regarding assigned trips.
- Mobile application for drivers to log status updates and upload expense receipts.
