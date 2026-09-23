# Student Discipline Management System (SDMS)

A full-stack discipline management system for school administration, designed to handle incidents, investigations, sanctions, suspensions, counselling, merits, behavioural reporting, and audit tracking across Nursery, Primary, and Secondary educational levels.

---

## Project Goals

- Record and manage learner conduct end-to-end.
- Support school rule enforcement and incident handling.
- Track investigations and hearings.
- Manage warnings, detention, suspension, expulsion, and counselling.
- Award merits and calculate term behaviour summaries.
- Maintain an audit trail for all sensitive actions.
- Expose a REST API for both web and mobile clients.

---

## Tech Stack

- **Database:** PostgreSQL
- **Backend:** PHP 8.2 (OOP / REST API)
- **Web frontend:** React 18 + Vite 5.4
- **Mobile frontend:** React Native + Expo SDK 51
- **Authentication:** JWT (JSON Web Tokens) & Bcrypt password hashing

---

## Roles

The system uses the following roles from the `users.role` field:

- Administrator
- Head Teacher
- Deputy Head Teacher
- Discipline Master
- Counsellor
- Class Teacher

Authorization is enforced in the backend REST API, not only hidden in the UI.

---

## Project Architecture

The system follows a classic 3-tier architecture:

- **React Web App** for school admin and management dashboards
- **React Native / Expo Mobile App** for teachers/staff incident reporting on mobile
- **PHP Backend API** that contains all business logic, validation, authentication, and database access
- **PostgreSQL Database** as the single source of truth

---

## Database Design Summary

The schema includes 17 core normalized (3NF) tables:

- `terms`
- `classes`
- `staff`
- `students`
- `offence_categories`
- `school_rules`
- `incidents`
- `incident_students`
- `investigations`
- `sanctions`
- `suspensions`
- `counselling_sessions`
- `merits`
- `behaviour_summary`
- `parent_involvement`
- `users`
- `audit_log`

Full schema details are in [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) and [reports/01_System_Setup_and_Database_Architecture.md](reports/01_System_Setup_and_Database_Architecture.md).

---

## Quick Start & Server Commands

### 1. Start PHP Backend API
From PowerShell:
```powershell
cd g:\assignment\student_discipline_ms\backend
.\serve.ps1
```
*(Runs backend server on `http://127.0.0.1:8000/api`)*

### 2. Start React Web Dashboard
From PowerShell:
```powershell
cd g:\assignment\student_discipline_ms\web
npm run dev
```
*(Runs web server on `http://localhost:5173`)*

### 3. Start Expo Mobile App
From PowerShell:
```powershell
cd g:\assignment\student_discipline_ms\mobile
.\start.ps1
```
*(Runs Expo dev server)*

---

## Mobile Setup (Expo & React Native)

### What Has Been Configured for Expo

- **Expo App Manifest ([`mobile/app.json`](mobile/app.json)):**  
  Configured the app metadata, slug (`sdms-mobile`), orientation (`portrait`), splash screen theme (`#102a43`), and platform settings for iOS, Android, and Web.

- **Package Configuration ([`mobile/package.json`](mobile/package.json)):**  
  Updated entry point to `expo/AppEntry.js` with standard Expo CLI scripts:
  - `npm start` $\rightarrow$ `expo start`
  - `npm run android` $\rightarrow$ `expo start --android`
  - `npm run ios` $\rightarrow$ `expo start --ios`

- **Smart Network API Client ([`mobile/src/api/client.ts`](mobile/src/api/client.ts)):**  
  Built a mobile API client with automatic environment detection:
  - **Android Emulator:** Automatically connects to `10.0.2.2:8000`
  - **iOS Simulator / Local:** Connects to `127.0.0.1:8000`
  - **Expo Go (Physical Phone):** Uses `EXPO_PUBLIC_API_URL` or network Wi-Fi IP.

- **Complete Expo Mobile UI ([`mobile/App.tsx`](mobile/App.tsx)):**  
  Designed a complete React Native interface for Expo with:
  - **Expo Status Bar integration** (`expo-status-bar`).
  - **Staff Login Screen** with pre-filled demo hints (`adong.grace` / `Grace@123`).
  - **Mobile Conduct Dashboard** showing live metrics (Students, Staff, Incidents, Audit Events).
  - **PostgreSQL Table Inspector** displaying all 17 database tables.
  - **API Connection Status Badge** showing the active server address.

- **Helper Launch Script ([`mobile/start.ps1`](mobile/start.ps1)):**  
  Created a script so you can launch Expo with a simple one-liner.

### How to Run the Mobile App with Expo

Open a new PowerShell terminal window and run:

```powershell
cd g:\assignment\student_discipline_ms\mobile
npx expo start
```
*(or run `.\start.ps1`)*

### Testing Options:
- **On a Physical Phone:** Download the **Expo Go** app from the App Store / Google Play Store, open your phone's camera, and scan the QR code displayed in your terminal.
- **On Web:** Press `w` in the terminal to preview the mobile UI in your browser.
- **On Android Emulator:** Press `a` in the terminal.
- **On iOS Simulator (Mac):** Press `i` in the terminal.

---

## Database Setup

The database name used by this project is: `school_discipline_db`

Local PostgreSQL credentials:
- **Host:** localhost
- **Port:** 5432
- **User:** postgres
- **Password:** 1234

### Create & Load Schema:
```powershell
$env:PGPASSWORD='1234'
$psql = 'C:\Program Files\PostgreSQL\18\bin\psql.exe'
& $psql -h localhost -U postgres -d postgres -c "CREATE DATABASE school_discipline_db OWNER postgres;"
& $psql -h localhost -U postgres -d school_discipline_db -f .\database\schema.sql
& $psql -h localhost -U postgres -d school_discipline_db -f .\database\seeders\demo_seed.sql
```

---

## Documentation & Reports

Detailed technical documentation and phase reports are available in the [`reports/`](reports/) folder:
- [Phase 1: System Setup, Environment & Database Architecture](reports/01_System_Setup_and_Database_Architecture.md)
- [Phase 2: Backend API, Authentication & Frontend Integration](reports/02_Backend_API_and_Frontend_Integration.md)

---

## License

This project is for educational/class assignment use unless otherwise specified by the institution.
