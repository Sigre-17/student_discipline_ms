# Student Discipline Management System (SDMS)

A full-stack discipline management system for school administration, designed to handle incidents, investigations, sanctions, suspensions, counselling, merits, behavioural reporting, and audit tracking.

This repository is currently in the planning and setup phase. The database schema, business rules, and API conventions have been defined in [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md), and the first implementation step is to create the PostgreSQL database and validate the schema before building the PHP API and frontend clients.

## Project Goals

- Record and manage learner conduct end-to-end.
- Support school rule enforcement and incident handling.
- Track investigations and hearings.
- Manage warnings, detention, suspension, expulsion, and counselling.
- Award merits and calculate term behaviour summaries.
- Maintain an audit trail for all sensitive actions.
- Expose a REST API for both web and mobile clients.

## Tech Stack

- Database: PostgreSQL
- Backend: PHP (OOP)
- Web frontend: React
- Mobile frontend: React Native
- Authentication: JWT bearer tokens

## Roles

The system uses the following roles from the users.role field:

- Administrator
- Head Teacher
- Deputy Head Teacher
- Discipline Master
- Counsellor
- Class Teacher

Authorization must be enforced in the backend, not only hidden in the UI.

## Project Architecture

The system follows a classic 3-tier architecture:

- React web app for school admin and management dashboards
- React Native mobile app for teachers/staff incident reporting
- PHP backend that contains all business logic, validation, and database access
- PostgreSQL database as the single source of truth

## Database Design Summary

The schema includes the following core tables:

- terms
- classes
- staff
- students
- offence_categories
- school_rules
- incidents
- incident_students
- investigations
- sanctions
- suspensions
- counselling_sessions
- merits
- behaviour_summary
- parent_involvement
- users
- audit_log

Full schema details are in [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md).

## Repository Structure

```text
student_discipline_ms/
├── PROJECT_CONTEXT.md
├── README.md
├── .gitignore
├── backend/
│   ├── app/
│   │   ├── Http/Controllers/Api/
│   │   ├── Http/Middleware/
│   │   ├── Http/Requests/
│   │   ├── Models/
│   │   ├── Services/
│   │   └── Policies/
│   ├── database/{migrations,seeders,factories}/
│   ├── routes/api.php
│   ├── config/
│   ├── tests/
│   ├── .env.example
│   └── composer.json
├── web/
│   ├── public/
│   ├── src/{api,components,features,context,hooks,routes,utils}/
│   ├── src/App.jsx
│   ├── src/main.jsx
│   ├── .env.example
│   └── package.json
├── mobile/
│   ├── src/{api,components,screens,navigation,context,utils}/
│   ├── android/
│   ├── ios/
│   ├── .env.example
│   ├── App.tsx
│   └── package.json
├── shared/{constants.js,validation.js}
├── database/
│   ├── schema.sql
│   └── seed_data.sql
└── docs/
	├── PROJECT_CONTEXT.md
	├── api-spec.md
	└── screenshots/
```

## Database Setup

The database name used by this project is:

- school_discipline_db

Local PostgreSQL credentials:

- Host: localhost
- Port: 5432
- User: postgres
- Password: 1234

### Create the database

From PowerShell, run:

```powershell
$env:PATH += ';C:\Program Files\PostgreSQL\18\bin'
$env:PGPASSWORD='1234'
$psql = 'C:\Program Files\PostgreSQL\18\bin\psql.exe'
$exists = & $psql -h localhost -U postgres -d postgres -Atqc "SELECT 1 FROM pg_database WHERE datname='school_discipline_db';"
if ($exists -ne '1') { & $psql -h localhost -U postgres -d postgres -c "CREATE DATABASE school_discipline_db OWNER postgres;" }
```

### Load the schema

```powershell
$env:PGPASSWORD='1234'
& $psql -h localhost -U postgres -d school_discipline_db -f .\database\schema.sql
```

### Verify the database connection

```powershell
$env:PGPASSWORD='1234'
& $psql -h localhost -U postgres -d school_discipline_db -c "SELECT current_database(), current_user;"
```

## PHP Backend Setup

The backend uses PHP 8.2, Laravel 12, Firebase JWT, and PHPUnit. PHP is expected at `C:\xampp\php\php.exe` on the current Windows development machine.

From PowerShell:

```powershell
Set-Location .\backend
Copy-Item .env.example .env
# Set DB_PASSWORD=1234 in .env for the local PostgreSQL instance.
$php = 'C:\xampp\php\php.exe'
& $php -d extension=zip composer.phar install
```

The local `.env` uses the development database and the default demo password `Grace@123`. This password is for local development only and must be replaced before deployment. Never commit `.env` or real credentials.

### Run the simple API

From the `backend` directory, with XAMPP PHP:

```powershell
$php = 'C:\xampp\php\php.exe'
& $php -d extension=pdo_pgsql -d extension=pgsql -S 127.0.0.1:8000 -t public
```

Available development endpoints:

- `POST /api/auth/login` with `{ "username": "adong.grace", "password": "Grace@123" }`
- `GET /api/tables` to confirm the 17 schema tables
- `GET /api/seed-status` to view selected seeded row counts

The demo seed is applied with:

```powershell
$env:PGPASSWORD='1234'
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -h localhost -U postgres -d school_discipline_db -f .\database\seeders\demo_seed.sql
```

### Run tests

The tests use the real PostgreSQL database and cover table discovery, seeded data, JWT creation, successful login, invalid passwords, and unknown users:

```powershell
Set-Location .\backend
$php = 'C:\xampp\php\php.exe'
& $php -d extension=pdo_pgsql -d extension=pgsql vendor/bin/phpunit --configuration phpunit.xml
```

## Business Rules to Implement in Backend

The backend must enforce the following logic:

1. Sanctions can only be created when the incident status is Heard.
2. Suspension and expulsion sanctions are restricted to Head Teacher, Deputy Head Teacher, or Administrator roles.
3. A suspension cannot move to Ongoing without notifying the parent or confirming parent_informed.
4. Demerit and merit values must update behaviour_summary for the correct student and term.
5. Confidential counselling records must be restricted to Counsellor and Head Teacher or the specific counsellor.
6. High demerit totals should trigger counselling follow-up.
7. Discipline records must be archived rather than hard-deleted.
8. All sensitive writes and logins must be written to audit_log.

## API Conventions

The project will expose a REST API based on the following contract:

- POST /api/auth/login
- POST /api/auth/logout
- GET /api/terms
- GET /api/classes
- GET /api/staff
- GET /api/students
- GET /api/offence-categories
- GET /api/school-rules
- GET /api/incidents
- GET /api/incidents/{id}/students
- GET /api/investigations
- GET /api/sanctions
- GET /api/suspensions
- GET /api/counselling-sessions
- GET /api/merits
- GET /api/behaviour-summary
- GET /api/students/{id}/behaviour-summary
- GET /api/parent-involvement
- GET /api/users
- GET /api/audit-log (Administrator only)

JWT bearer tokens should be required on all protected endpoints.

## Recommended Build Order

1. PostgreSQL database creation and schema migration
2. PHP backend API with role validation and business rules
3. React web frontend
4. React Native mobile app

## Important Notes

- Passwords must never be stored as plain text.
- Use password_hash for user account passwords.
- Use PostgreSQL foreign keys and add indexes on frequently queried fields.
- Archive, do not hard-delete, discipline records.
- Always write to audit_log for sensitive write operations.

## Next Steps

After database creation, the next work should be:

- create the PHP Laravel or raw PHP backend structure,
- add JWT authentication,
- implement the core CRUD APIs,
- enforce all role-based rules in the backend,
- then build the React web dashboard,
- and finally the React Native app.

## Source of Requirements

The design and schema for this project are governed by [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md). All future implementation work should follow that document exactly unless explicitly clarified.

## License

This project is for educational/class assignment use unless otherwise specified by the institution.
