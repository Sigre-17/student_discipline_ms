# Project Context: Student Discipline Management System (SDMS)

> **Purpose of this file:** This is a context/reference document for an AI coding assistant (e.g. GitHub Copilot) working in this repository. Read this in full before writing or suggesting any code. It describes the entire project — purpose, tech stack, architecture, full database schema, business rules, roles, and API/frontend requirements — so that all future code suggestions are consistent with the overall design. **No implementation exists yet; this is a planning/context document only.**

---

## 1. Project Summary

**Name:** Student Discipline Management System (SDMS)
**Type:** Class assignment — full-stack, multi-client application
**Domain:** School administration — nursery, primary and secondary levels

**What it does:** Records and manages learner conduct end-to-end — offences, investigations, sanctions (warnings, detention, suspension, expulsion), counselling, merits/commendations, parent communication, and termly behaviour reporting for school administrators.

**Core functional scope:**
- Define school rules, offence categories, and their prescribed sanctions.
- Allow staff to report disciplinary incidents.
- Support investigation, hearing, and determination of cases.
- Record sanctions, including detailed suspension tracking.
- Log counselling sessions and follow-up actions.
- Award merit points for good conduct.
- Produce per-student, per-class, per-term behaviour reports.
- Maintain a full audit trail of system changes.

---

## 2. Required Tech Stack (fixed — do not suggest alternatives)

| Layer | Technology | Notes |
|---|---|---|
| Database | **PostgreSQL** | Single shared database; all three clients read/write through the backend only, never directly |
| Backend / API | **PHP** | Exposes a REST API consumed by both frontends. Framework choice is open (Laravel recommended for auth + ORM tooling) but must be PHP |
| Web frontend | **React** | Single Page Application for desktop/browser use, primarily by administrative/management roles |
| Mobile frontend | **React Native** | Native Android/iOS app, primarily for teachers/staff reporting incidents on the move |

**Architecture style:** Classic 3-tier client-server. React and React Native are both "thin" clients — all business logic, validation and data access live in the PHP backend. Neither frontend ever connects to PostgreSQL directly.

```
[React Web App]  \
                   >---- HTTPS / JSON (REST API) ----> [PHP Backend] ----> [PostgreSQL]
[React Native App]/
```

Authentication: token-based (JWT recommended) so both clients can authenticate against the same backend statelessly.

---

## 3. User Roles (from the `users.role` field)

| Role | Typical scope of access |
|---|---|
| Administrator | Full system access, including user account management |
| Head Teacher | Full visibility into all discipline data and confidential counselling notes; approves suspensions/expulsions |
| Deputy Head Teacher | Broad visibility, similar to Head Teacher, minus certain admin-only functions |
| Discipline Master | Manages incidents, investigations, sanctions, suspensions |
| Counsellor | Manages counselling sessions; confidential notes restricted to Counsellor + Head Teacher only |
| Class Teacher | Reports incidents for their own class/students; views their own class's behaviour summary |

Authorization must be enforced **in the backend**, not just hidden in the UI — every endpoint must check the requesting user's role before performing the action, per the business rules in Section 6.

---

## 4. Database Schema (PostgreSQL)

17 tables, 3NF normalized, 29 foreign key relationships. Naming convention: lower_snake_case, plural table names, singular column names. Below is the full schema translated from the original MySQL design into PostgreSQL syntax.

**Translation notes from the source design doc (originally MySQL-targeted):**
- `AUTO_INCREMENT` → `SERIAL` / `BIGSERIAL`
- `ENUM(...)` → `VARCHAR` + `CHECK` constraint (simpler to maintain in Postgres than native enum types)
- `TINYINT` → `SMALLINT`
- `DATETIME` → `TIMESTAMP`
- `ENGINE=InnoDB` → removed (not applicable; Postgres always enforces referential integrity)
- Foreign keys are added via `ALTER TABLE` at the end, in the same style as the source script, to avoid table-creation ordering issues.

```sql
-- =====================================================
-- STUDENT DISCIPLINE MANAGEMENT SYSTEM
-- Database: school_discipline_db (PostgreSQL)
-- =====================================================

CREATE TABLE terms (
    term_id        SERIAL PRIMARY KEY,
    academic_year  VARCHAR(9) NOT NULL,
    term_name      VARCHAR(10) NOT NULL CHECK (term_name IN ('Term 1','Term 2','Term 3')),
    start_date     DATE NOT NULL,
    end_date       DATE NOT NULL,
    is_current     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP
);

CREATE TABLE classes (
    class_id          SERIAL PRIMARY KEY,
    class_name        VARCHAR(30) NOT NULL,
    stream            VARCHAR(20),
    school_level      VARCHAR(10) NOT NULL CHECK (school_level IN ('Nursery','Primary','Secondary')),
    class_teacher_id  INT,
    capacity          INT,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP
);

CREATE TABLE staff (
    staff_id     SERIAL PRIMARY KEY,
    staff_no     VARCHAR(20) NOT NULL UNIQUE,
    first_name   VARCHAR(50) NOT NULL,
    last_name    VARCHAR(50) NOT NULL,
    gender       VARCHAR(6) NOT NULL CHECK (gender IN ('Male','Female')),
    phone        VARCHAR(20),
    email        VARCHAR(100) UNIQUE,
    staff_type   VARCHAR(20) NOT NULL CHECK (staff_type IN ('Teaching','Non-Teaching','Administration')),
    status       VARCHAR(15) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','On Leave','Suspended','Exited')),
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP
);

CREATE TABLE students (
    student_id     SERIAL PRIMARY KEY,
    admission_no   VARCHAR(20) NOT NULL UNIQUE,
    first_name     VARCHAR(50) NOT NULL,
    last_name      VARCHAR(50) NOT NULL,
    date_of_birth  DATE NOT NULL,
    gender         VARCHAR(6) NOT NULL CHECK (gender IN ('Male','Female')),
    school_level   VARCHAR(10) NOT NULL CHECK (school_level IN ('Nursery','Primary','Secondary')),
    class_id       INT,
    status         VARCHAR(15) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Transferred','Graduated','Withdrawn')),
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP
);

CREATE TABLE offence_categories (
    category_id     SERIAL PRIMARY KEY,
    category_name   VARCHAR(60) NOT NULL UNIQUE,
    severity_level  VARCHAR(10) NOT NULL CHECK (severity_level IN ('Minor','Moderate','Serious','Grave')),
    demerit_points  SMALLINT NOT NULL DEFAULT 1,
    description     VARCHAR(255),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP
);

CREATE TABLE school_rules (
    rule_id              SERIAL PRIMARY KEY,
    category_id          INT NOT NULL,
    rule_text            VARCHAR(300) NOT NULL,
    prescribed_sanction  VARCHAR(200),
    applies_to_level     VARCHAR(10) NOT NULL DEFAULT 'All' CHECK (applies_to_level IN ('Nursery','Primary','Secondary','All')),
    is_active            BOOLEAN NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP
);

CREATE TABLE incidents (
    incident_id     SERIAL PRIMARY KEY,
    incident_date   DATE NOT NULL,
    incident_time   TIME,
    location        VARCHAR(80),
    category_id     INT NOT NULL,
    rule_id         INT,
    description     TEXT NOT NULL,
    reported_by     INT NOT NULL,
    term_id         INT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'Reported' CHECK (status IN ('Reported','Under Investigation','Heard','Closed','Dismissed')),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP
);

CREATE TABLE incident_students (
    involvement_id     SERIAL PRIMARY KEY,
    incident_id        INT NOT NULL,
    student_id         INT NOT NULL,
    role_in_incident   VARCHAR(15) NOT NULL CHECK (role_in_incident IN ('Offender','Victim','Witness','Accomplice')),
    statement          TEXT,
    demerit_points     SMALLINT,
    created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP
);

CREATE TABLE investigations (
    investigation_id  SERIAL PRIMARY KEY,
    incident_id       INT NOT NULL,
    investigator_id   INT NOT NULL,
    start_date        DATE NOT NULL,
    findings          TEXT,
    recommendation    VARCHAR(500),
    completion_date   DATE,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP
);

CREATE TABLE sanctions (
    sanction_id     SERIAL PRIMARY KEY,
    incident_id     INT NOT NULL,
    student_id      INT NOT NULL,
    sanction_type   VARCHAR(20) NOT NULL CHECK (sanction_type IN ('Verbal Warning','Written Warning','Detention','Manual Work','Suspension','Expulsion','Parent Summons')),
    details         VARCHAR(300),
    start_date      DATE,
    end_date        DATE,
    issued_by       INT,
    status          VARCHAR(10) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Ongoing','Completed','Waived','Appealed')),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP
);

CREATE TABLE suspensions (
    suspension_id           SERIAL PRIMARY KEY,
    sanction_id             INT NOT NULL UNIQUE,
    student_id              INT NOT NULL,
    days_suspended          INT NOT NULL,
    date_out                DATE NOT NULL,
    expected_return         DATE NOT NULL,
    actual_return           DATE,
    conditions_for_return   VARCHAR(300),
    parent_informed         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP
);

CREATE TABLE counselling_sessions (
    session_id         SERIAL PRIMARY KEY,
    student_id         INT NOT NULL,
    incident_id        INT,
    counsellor_id      INT NOT NULL,
    session_date       DATE NOT NULL,
    issues_discussed   VARCHAR(500),
    agreed_actions     VARCHAR(500),
    follow_up_date     DATE,
    is_confidential    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP
);

CREATE TABLE merits (
    merit_id       SERIAL PRIMARY KEY,
    student_id     INT NOT NULL,
    term_id        INT NOT NULL,
    reason         VARCHAR(255) NOT NULL,
    merit_points   SMALLINT NOT NULL DEFAULT 1,
    awarded_by     INT,
    award_date     DATE NOT NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP
);

CREATE TABLE behaviour_summary (
    summary_id        SERIAL PRIMARY KEY,
    student_id        INT NOT NULL,
    term_id           INT NOT NULL,
    class_id          INT,
    total_incidents   INT NOT NULL DEFAULT 0,
    total_demerits    INT NOT NULL DEFAULT 0,
    total_merits      INT NOT NULL DEFAULT 0,
    conduct_grade     VARCHAR(10) CHECK (conduct_grade IN ('Excellent','Good','Fair','Poor')),
    remarks           VARCHAR(255),
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP
);

CREATE TABLE parent_involvement (
    involvement_id    SERIAL PRIMARY KEY,
    incident_id       INT NOT NULL,
    student_id        INT NOT NULL,
    parent_name       VARCHAR(100) NOT NULL,
    contact_method    VARCHAR(15) NOT NULL CHECK (contact_method IN ('Phone Call','SMS','Letter','Meeting')),
    contact_date      DATE NOT NULL,
    parent_response   VARCHAR(500),
    handled_by        INT,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP
);

CREATE TABLE users (
    user_id         SERIAL PRIMARY KEY,
    username        VARCHAR(50) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(100) NOT NULL,
    role            VARCHAR(25) NOT NULL CHECK (role IN ('Administrator','Head Teacher','Deputy Head Teacher','Discipline Master','Counsellor','Class Teacher')),
    linked_id       INT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    last_login      TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP
);

CREATE TABLE audit_log (
    log_id           BIGSERIAL PRIMARY KEY,
    user_id          INT,
    action           VARCHAR(30) NOT NULL,        -- INSERT, UPDATE, DELETE, LOGIN
    table_affected   VARCHAR(60) NOT NULL,
    record_id        VARCHAR(40),
    details          TEXT,
    action_time      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Foreign key constraints
-- =====================================================
ALTER TABLE classes              ADD CONSTRAINT fk_classes_class_teacher_id       FOREIGN KEY (class_teacher_id) REFERENCES staff(staff_id);
ALTER TABLE students             ADD CONSTRAINT fk_students_class_id              FOREIGN KEY (class_id) REFERENCES classes(class_id);
ALTER TABLE school_rules         ADD CONSTRAINT fk_school_rules_category_id       FOREIGN KEY (category_id) REFERENCES offence_categories(category_id);
ALTER TABLE incidents            ADD CONSTRAINT fk_incidents_category_id          FOREIGN KEY (category_id) REFERENCES offence_categories(category_id);
ALTER TABLE incidents            ADD CONSTRAINT fk_incidents_rule_id              FOREIGN KEY (rule_id) REFERENCES school_rules(rule_id);
ALTER TABLE incidents            ADD CONSTRAINT fk_incidents_reported_by          FOREIGN KEY (reported_by) REFERENCES staff(staff_id);
ALTER TABLE incidents            ADD CONSTRAINT fk_incidents_term_id              FOREIGN KEY (term_id) REFERENCES terms(term_id);
ALTER TABLE incident_students    ADD CONSTRAINT fk_incident_students_incident_id  FOREIGN KEY (incident_id) REFERENCES incidents(incident_id);
ALTER TABLE incident_students    ADD CONSTRAINT fk_incident_students_student_id   FOREIGN KEY (student_id) REFERENCES students(student_id);
ALTER TABLE investigations       ADD CONSTRAINT fk_investigations_incident_id     FOREIGN KEY (incident_id) REFERENCES incidents(incident_id);
ALTER TABLE investigations       ADD CONSTRAINT fk_investigations_investigator_id FOREIGN KEY (investigator_id) REFERENCES staff(staff_id);
ALTER TABLE sanctions            ADD CONSTRAINT fk_sanctions_incident_id          FOREIGN KEY (incident_id) REFERENCES incidents(incident_id);
ALTER TABLE sanctions            ADD CONSTRAINT fk_sanctions_student_id           FOREIGN KEY (student_id) REFERENCES students(student_id);
ALTER TABLE sanctions            ADD CONSTRAINT fk_sanctions_issued_by            FOREIGN KEY (issued_by) REFERENCES staff(staff_id);
ALTER TABLE suspensions          ADD CONSTRAINT fk_suspensions_sanction_id        FOREIGN KEY (sanction_id) REFERENCES sanctions(sanction_id);
ALTER TABLE suspensions          ADD CONSTRAINT fk_suspensions_student_id         FOREIGN KEY (student_id) REFERENCES students(student_id);
ALTER TABLE counselling_sessions ADD CONSTRAINT fk_counselling_sessions_student_id    FOREIGN KEY (student_id) REFERENCES students(student_id);
ALTER TABLE counselling_sessions ADD CONSTRAINT fk_counselling_sessions_incident_id   FOREIGN KEY (incident_id) REFERENCES incidents(incident_id);
ALTER TABLE counselling_sessions ADD CONSTRAINT fk_counselling_sessions_counsellor_id FOREIGN KEY (counsellor_id) REFERENCES staff(staff_id);
ALTER TABLE merits               ADD CONSTRAINT fk_merits_student_id              FOREIGN KEY (student_id) REFERENCES students(student_id);
ALTER TABLE merits               ADD CONSTRAINT fk_merits_term_id                 FOREIGN KEY (term_id) REFERENCES terms(term_id);
ALTER TABLE merits               ADD CONSTRAINT fk_merits_awarded_by              FOREIGN KEY (awarded_by) REFERENCES staff(staff_id);
ALTER TABLE behaviour_summary    ADD CONSTRAINT fk_behaviour_summary_student_id   FOREIGN KEY (student_id) REFERENCES students(student_id);
ALTER TABLE behaviour_summary    ADD CONSTRAINT fk_behaviour_summary_term_id      FOREIGN KEY (term_id) REFERENCES terms(term_id);
ALTER TABLE behaviour_summary    ADD CONSTRAINT fk_behaviour_summary_class_id     FOREIGN KEY (class_id) REFERENCES classes(class_id);
ALTER TABLE parent_involvement   ADD CONSTRAINT fk_parent_involvement_incident_id FOREIGN KEY (incident_id) REFERENCES incidents(incident_id);
ALTER TABLE parent_involvement   ADD CONSTRAINT fk_parent_involvement_student_id  FOREIGN KEY (student_id) REFERENCES students(student_id);
ALTER TABLE parent_involvement   ADD CONSTRAINT fk_parent_involvement_handled_by  FOREIGN KEY (handled_by) REFERENCES staff(staff_id);
ALTER TABLE audit_log            ADD CONSTRAINT fk_audit_log_user_id              FOREIGN KEY (user_id) REFERENCES users(user_id);
```

### Entity relationship summary
- One `offence_categories` row → many `school_rules`, many `incidents` (1:M).
- One `incidents` row → many `incident_students` (1:M), at most one `investigations` (1:1 in practice), many `sanctions`, many `parent_involvement` contacts (1:M).
- One `sanctions` row of type `'Suspension'` → exactly one `suspensions` row (1:1, enforced by `UNIQUE` on `suspensions.sanction_id`).
- One `students` row → many `incidents` (via `incident_students`), many `sanctions`, many `counselling_sessions`, many `merits` over time (1:M).
- One `terms` row → one `behaviour_summary` row per student for that term (1:M from `terms`).

---

## 5. Business Rules the Backend Must Enforce

These are not automatically enforced by the database schema alone — they must be implemented as application logic in PHP:

1. A `sanctions` record may only be created for an `incidents` row whose `status = 'Heard'`.
2. `sanction_type` of `'Suspension'` or `'Expulsion'` may only be created by users with role `Head Teacher`, `Deputy Head Teacher`, or `Administrator` (representing "head teacher or disciplinary committee").
3. A suspension's `status` may not move to `'Ongoing'` until a corresponding `parent_involvement` record exists (or `suspensions.parent_informed = TRUE`).
4. When an `incident_students` row or `sanctions` row carries demerit points, the matching `behaviour_summary` row for that student/term must be incremented (create the summary row if it doesn't exist yet for that term).
5. `counselling_sessions` rows with `is_confidential = TRUE` must only be returned by the API to users with role `Counsellor` or `Head Teacher` (or the specific `counsellor_id` on the record).
6. If a student's accumulated demerit points (from `behaviour_summary.total_demerits`) cross a school-configured threshold, the backend should auto-flag or auto-create a pending `counselling_sessions` record for that student.
7. No hard deletes are permitted on discipline-related tables (`incidents`, `sanctions`, `suspensions`, `counselling_sessions`, `merits`, etc.) — records must be retained for the full period of study. Use status/archive flags instead of `DELETE`.
8. Every `INSERT`, `UPDATE`, or `DELETE` on a sensitive table, and every login, must create a corresponding row in `audit_log` (`user_id`, `action`, `table_affected`, `record_id`, `details`, `action_time`).

---

## 6. API Design Conventions

- Style: REST over HTTPS, JSON request/response bodies.
- Auth: JWT bearer token issued at `POST /api/auth/login`; required on all endpoints except login.
- Standard verbs: `GET` (read), `POST` (create), `PUT`/`PATCH` (update), `DELETE` (archive/deactivate only — never a real row delete on discipline tables, per Rule 7 above).
- Expected resource collections (one CRUD-style group per table, plus a couple of composite/report endpoints):

```
/api/auth/login
/api/auth/logout
/api/terms
/api/classes
/api/staff
/api/students
/api/offence-categories
/api/school-rules
/api/incidents
/api/incidents/{id}/students        (manages incident_students)
/api/investigations
/api/sanctions
/api/suspensions
/api/counselling-sessions
/api/merits
/api/behaviour-summary
/api/students/{id}/behaviour-summary   (composite/report endpoint)
/api/parent-involvement
/api/users
/api/audit-log                       (read-only, Administrator only)
```

- Every write endpoint on a sensitive table must also write to `audit_log` (see Rule 8).
- Every endpoint must check the requester's `role` (from the JWT) against the permission rules in Section 3 and 5 before proceeding.

---

## 7. Frontend Requirements

### 7.1 React web app (primary users: management/admin roles)
- Role-based login and dashboard routing.
- School-wide / class-wide behaviour dashboards (built from `behaviour_summary`).
- Incident list/detail/edit, investigation assignment and recording.
- Sanction and suspension management and tracking.
- School rule / offence category management (Administrator/Head Teacher).
- Merit awarding and termly leaderboards.
- Counselling records, respecting `is_confidential`.
- Parent contact log.
- User account management (Administrator only).
- Exportable termly conduct reports.

### 7.2 React Native mobile app (primary users: teachers/prefects)
- Simple login.
- Fast "Report an Incident" form as the primary screen.
- "My Reported Incidents" list with live status.
- Notifications (e.g. incident status changes, serious incident alerts).
- Optional read-only student conduct history, permission-gated by role.

---

## 8. Non-Functional Requirements

- Passwords stored only as hashes (never plain text) — e.g. via PHP's `password_hash()`.
- Every foreign key column, and columns frequently searched (names, dates, reference numbers, status fields), should be indexed.
- Composite unique constraints where a record must be unique per person per period (e.g. one `behaviour_summary` row per student per term — recommend `UNIQUE (student_id, term_id)`).
- Daily database backups (off-site), with restore procedure tested periodically.
- Records archived, never hard-deleted, on discipline-related tables.

---

## 9. Current Project Status

- [x] Database schema designed (this document).
- [ ] PostgreSQL database created and migrated.
- [ ] PHP backend / API — not started.
- [ ] React web app — not started.
- [ ] React Native mobile app — not started.

**Recommended build order:** PostgreSQL schema → PHP backend (fully tested via API client, e.g. Postman, before any frontend work) → React web app → React Native mobile app last, reusing the already-tested API.

---

*End of context file. When asked to generate code for this project, follow the schema, roles, business rules and API conventions defined above exactly, and ask for clarification only where this document is genuinely silent on a needed detail.*
