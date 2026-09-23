# Comprehensive Technical Report — Phase 1: System Architecture, Environment Setup & Database Design

**System Name:** Student Discipline Management System (SDMS)  
**Document Type:** Detailed Academic & Supervisor Reference Manual (Phase 1 & Mobile Architecture)  
**Target Audience:** Academic Supervisor, Project Examiners, System Administrators, Software Engineers  
**Scope:** Operational Background, 3-Tier Architecture, Database Modeling (17 Relational Tables), PostgreSQL Constraints, Mobile Expo Setup, Security Design, and Seed Data Strategy  

---

## Executive Summary

Educational institutions—spanning Nursery, Primary, and Secondary school levels—face growing challenges in managing learner behavior, maintaining discipline records, and ensuring consistent administrative action. Traditional paper-based discipline record-keeping suffers from lost physical files, lack of confidentiality, delay in reporting serious incidents, and an inability to generate termly behavior summaries or track long-term student trends.

The **Student Discipline Management System (SDMS)** is a modern, enterprise-grade, multi-client web and mobile software solution designed to digitize, centralize, and streamline school discipline management end-to-end. 

Phase 1 of this project established the foundational architecture, runtime environment, database schema design, integrity rules, mobile Expo setup, and database seeding strategy. This document provides an exhaustive, non-technical and technical explanation of everything accomplished in Phase 1, detailing **what** was implemented, **why** specific technical choices were made, and **how** each component functions.

---

## 1. Background & School Operational Scope

To build an effective school management system, the software design must accurately reflect the real-world operational structure of a school.

```
+-----------------------------------------------------------------------------------+
|                            SCHOOL DISCIPLINE WORKFLOW                             |
|                                                                                   |
|  [ Incident Occurs ]                                                              |
|          |                                                                        |
|          v                                                                        |
|  [ Incident Reported by Staff member via Mobile/Web ]                             |
|          |                                                                        |
|          v                                                                        |
|  [ Case Assigned to Discipline Master / Investigator ]                            |
|          |                                                                        |
|          v                                                                        |
|  [ Formal Hearing & Determination ]                                                |
|          |                                                                        |
|          +--------------------------+--------------------------+                  |
|          |                          |                          |                  |
|          v                          v                          v                  |
|  [ Issued Sanctions ]     [ Counselling Session ]      [ Parent Informed ]       |
|  (Warning / Detention /   (Confidential notes by     (SMS / Meeting logged)       |
|   Suspension / Expulsion)  Counsellor & Head Teacher)                              |
|          |                                                                        |
|          +--------------------------+--------------------------+                  |
|                                     |                                             |
|                                     v                                             |
|                   [ Termly Conduct Grade & Audit Log ]                            |
+-----------------------------------------------------------------------------------+
```

### Key Administrative Roles Enforced by the System:
1. **Administrator:** System manager responsible for user accounts, role definitions, and system settings.
2. **Head Teacher:** Executive authority with complete visibility across all school records, including confidential counselling notes. Approves severe sanctions such as suspensions and expulsions.
3. **Deputy Head Teacher:** Operational supervisor overseeing school-wide conduct and assisting the Head Teacher.
4. **Discipline Master:** Lead disciplinary officer handling day-to-day incident management, investigations, hearings, and sanction tracking.
5. **Counsellor:** Guidance officer recording sensitive psychological support sessions. Notes are strictly confidential and visible only to the Counsellor and Head Teacher.
6. **Class Teacher:** Frontline educator monitoring a specific class stream, reporting incidents, awarding merit points for good conduct, and reviewing class behavior scorecards.

---

## 2. Understanding the 3-Tier Architecture (Simplified)

For non-technical readers, software architecture is best understood using an analogy of a **High-End Restaurant**:

```
[ Customer at Table ]       <--->   [ Waiter taking Orders ]   <--->   [ Kitchen / Pantry ]
(React Web / Mobile UI)            (PHP REST API Server)              (PostgreSQL Database)
- Sees beautiful menu               - Validates customer order        - Stores all ingredients
- Places order via buttons          - Checks customer permission      - Reads & writes data
- Displays food neatly              - Passes orders back & forth      - Completely hidden from customer
```

### Why a 3-Tier Architecture was Chosen:

1. **Security (Zero Direct Database Access):**
   Neither the React Web App nor the React Native Mobile App ever touches the PostgreSQL database directly. If a student inspects the web app's browser code, they will never see database passwords or direct database connections. Every request must pass through the PHP API "Waiter", which checks if the user is authorized before fetching or changing any data.

2. **Multi-Client Support:**
   The school needs two interfaces:
   - **React Web Application:** Used by Head Teachers, Discipline Masters, and Administrators sitting at office desktop computers.
   - **React Native Mobile Application:** Used by teachers walking around campus or monitoring dormitories on smartphones/tablets.
   
   Because both frontends communicate using standard HTTP/JSON API requests, a **single PHP backend** serves both web and mobile clients without duplicating business logic.

3. **Single Source of Truth:**
   All school data resides in one central PostgreSQL database. This prevents conflicting data, such as a student being marked as active on mobile while recorded as suspended on desktop.

---

## 3. Environment Setup & Technology Stack

The project relies on core enterprise technologies, selected for stability, security, and industrial popularity:

| Technology | Role | Why It Was Chosen |
|---|---|---|
| **PostgreSQL 18** | Relational Database | Enterprise-grade database offering strict data safety, support for thousands of concurrent records, robust foreign keys, and custom domain constraints. |
| **PHP 8.2 (XAMPP)** | Backend REST API Server | Fast, lightweight server-side programming language with built-in database connection libraries (PDO) and widespread web hosting compatibility. |
| **Node.js (v24.x) & npm** | Frontend Runtime & Package Manager | Industry-standard runtime environment for running modern web development tools and installing JavaScript packages. |
| **Vite (v5.4) & React 18** | Web Frontend Build Tool & Framework | React provides a component-based user interface, while Vite provides lighting-fast compilation and instant hot reloading during development. |
| **React Native + Expo SDK 51** | Mobile Frontend Framework | Enables rapid cross-platform mobile development for Android, iOS, and Web with real-time phone testing via the Expo Go app. |

### Step-by-Step Environment Configuration:
1. **PostgreSQL Installation:** Installed and configured listening on standard port `5432` with database `school_discipline_db`.
2. **PHP PDO Extension Configuration:** 
   In standard XAMPP installations, PostgreSQL extensions are disabled by default. The configuration file `C:\xampp\php\php.ini` was edited to enable:
   ```ini
   extension=pdo_pgsql
   extension=pgsql
   ```
   This enabled PHP to communicate directly with PostgreSQL via PDO (PHP Data Objects).

---

## 3.1. Mobile Application Infrastructure & Expo Setup

To enable teachers and discipline officers to record incidents on smartphones and tablets while moving around the school compound, the mobile client was configured using **React Native** and **Expo SDK 51**.

```
+-----------------------------------------------------------------------------------+
|                            MOBILE EXPO INFRASTRUCTURE                             |
|                                                                                   |
|  [ Expo Mobile App (App.tsx) ]  <---> [ Smart API Client (client.ts) ]              |
|                                                |                                  |
|         +--------------------------------------+----------------------------------+
|         | (Android Emulator: 10.0.2.2)         | (iOS / Local: 127.0.0.1)         |
|         |                                      |                                  |
|         v                                      v                                  |
|  [ Expo Go via Wi-Fi IP (192.168.x.x) ]  <---> [ PHP API Backend (serve.ps1) ]       |
+-----------------------------------------------------------------------------------+
```

### 📱 Detailed Mobile Configuration:

1. **Expo App Manifest ([`mobile/app.json`](mobile/app.json)):**  
   Configured the app metadata, slug (`sdms-mobile`), orientation (`portrait`), splash screen theme (`#102a43`), and platform settings for iOS, Android, and Web.

2. **Package Configuration ([`mobile/package.json`](mobile/package.json)):**  
   Updated entry point to `expo/AppEntry.js` with standard Expo CLI scripts:
   - `npm start` $\rightarrow$ `expo start`
   - `npm run android` $\rightarrow$ `expo start --android`
   - `npm run ios` $\rightarrow$ `expo start --ios`

3. **Smart Network API Client ([`mobile/src/api/client.ts`](mobile/src/api/client.ts)):**  
   Built a mobile API client with automatic environment detection:
   - **Android Emulator:** Automatically connects to `10.0.2.2:8000`
   - **iOS Simulator / Local:** Connects to `127.0.0.1:8000`
   - **Expo Go (Physical Phone):** Uses `EXPO_PUBLIC_API_URL` or network Wi-Fi IP (`http://192.168.x.x:8000/api`).

4. **Complete Expo Mobile UI ([`mobile/App.tsx`](mobile/App.tsx)):**  
   Designed a complete React Native interface for Expo featuring:
   - **Expo Status Bar integration** (`expo-status-bar`).
   - **Staff Login Screen** with pre-filled demo hints (`adong.grace` / `Grace@123`).
   - **Mobile Conduct Dashboard** showing live metrics (Students, Staff, Incidents, Audit Events).
   - **PostgreSQL Table Inspector** displaying all 17 database tables.
   - **API Connection Status Badge** showing the active server address.

5. **Helper Launch Script ([`mobile/start.ps1`](mobile/start.ps1)):**  
   Created a script so developers can launch Expo with a simple one-liner.

### 🚀 How to Run and Test the Mobile App:

Run the following command from the `mobile/` directory:
```powershell
cd g:\assignment\student_discipline_ms\mobile
npx expo start
```
*(or run `.\start.ps1`)*

#### 📲 Testing Options Available:
- **Physical Phone (Expo Go):** Download **Expo Go** from Google Play / App Store, open your phone camera, and scan the terminal QR code.
- **Web Preview:** Press `w` in the terminal to view in a browser.
- **Android Emulator:** Press `a` in the terminal.
- **iOS Simulator (Mac):** Press `i` in the terminal.

---

## 4. In-Depth Database Schema (All 17 Relational Tables Explained)

The database schema forms the backbone of the system. It was designed according to **Third Normal Form (3NF)** rules, ensuring that data is organized logically without unnecessary duplication. 

Below is an exhaustive breakdown of all 17 tables, explaining **what** data they store, **why** they are necessary, and **how** they relate to other tables:

---

### Table 1: `terms` (Academic Terms)
- **Purpose:** Schools operate in structured academic periods (e.g., Term 1 2026). This table tracks academic years, start/end dates, and identifies which term is currently active.
- **Key Columns:**
  - `term_id` (SERIAL PRIMARY KEY): Unique numeric identifier for the term.
  - `academic_year` (VARCHAR(9)): E.g., `"2026"` or `"2026/2027"`.
  - `term_name` (VARCHAR(10)): Restrained to `'Term 1'`, `'Term 2'`, or `'Term 3'`.
  - `is_current` (BOOLEAN): Flag indicating if this is the active school term.

---

### Table 2: `classes` (Class Streams)
- **Purpose:** Represents individual classrooms (e.g., "S.1 East" or "Primary 4 Blue").
- **Key Columns:**
  - `class_id` (SERIAL PRIMARY KEY): Unique identifier.
  - `class_name` (VARCHAR(30)): E.g., `"S.1"`, `"P.5"`.
  - `stream` (VARCHAR(20)): E.g., `"East"`, `"North"`.
  - `school_level` (VARCHAR(10)): Restrained to `'Nursery'`, `'Primary'`, or `'Secondary'`.
  - `class_teacher_id` (INT): Foreign Key referencing `staff(staff_id)` — identifies the assigned teacher.

---

### Table 3: `staff` (Staff Members)
- **Purpose:** Stores records of all school employees (teachers, administrators, counsellors, support staff).
- **Key Columns:**
  - `staff_id` (SERIAL PRIMARY KEY): Unique identifier.
  - `staff_no` (VARCHAR(20) UNIQUE): Employment registration number (e.g., `"STF-001"`).
  - `first_name`, `last_name` (VARCHAR(50)): Employee name.
  - `staff_type` (VARCHAR(20)): Restrained to `'Teaching'`, `'Non-Teaching'`, or `'Administration'`.
  - `status` (VARCHAR(15)): Restrained to `'Active'`, `'On Leave'`, `'Suspended'`, or `'Exited'`.

---

### Table 4: `students` (Student Profiles)
- **Purpose:** Stores core student demographic information and active enrollment status.
- **Key Columns:**
  - `student_id` (SERIAL PRIMARY KEY): Unique internal student ID.
  - `admission_no` (VARCHAR(20) UNIQUE): Official school admission number (e.g., `"GUL/2026/001"`).
  - `date_of_birth` (DATE), `gender` (VARCHAR(6)).
  - `school_level` (VARCHAR(10)): Educational level.
  - `class_id` (INT): Foreign Key referencing `classes(class_id)`.
  - `status` (VARCHAR(15)): Restrained to `'Active'`, `'Transferred'`, `'Graduated'`, or `'Withdrawn'`.

---

### Table 5: `offence_categories` (Offence Classification)
- **Purpose:** Defines types of misconduct and assigns standard severity levels and penalty weights.
- **Key Columns:**
  - `category_id` (SERIAL PRIMARY KEY): Unique identifier.
  - `category_name` (VARCHAR(60) UNIQUE): E.g., `"Bullying"`, `"Late Coming"`, `"Substance Abuse"`.
  - `severity_level` (VARCHAR(10)): Restrained to `'Minor'`, `'Moderate'`, `'Serious'`, or `'Grave'`.
  - `demerit_points` (SMALLINT): Default demerit weight assigned for offences in this category.

---

### Table 6: `school_rules` (School Code of Conduct)
- **Purpose:** Maps specific written school rules to offence categories and defines standard prescribed sanctions.
- **Key Columns:**
  - `rule_id` (SERIAL PRIMARY KEY): Unique rule ID.
  - `category_id` (INT): Foreign Key referencing `offence_categories(category_id)`.
  - `rule_text` (VARCHAR(300)): Written rule description (e.g., *"Students must wear complete uniform at all times"*).
  - `prescribed_sanction` (VARCHAR(200)): Default suggested consequence.
  - `applies_to_level` (VARCHAR(10)): Restrained to `'Nursery'`, `'Primary'`, `'Secondary'`, or `'All'`.

---

### Table 7: `incidents` (Reported Conduct Incidents)
- **Purpose:** Logs specific disciplinary events reported by staff members.
- **Key Columns:**
  - `incident_id` (SERIAL PRIMARY KEY): Unique incident record ID.
  - `incident_date` (DATE), `incident_time` (TIME), `location` (VARCHAR(80)).
  - `category_id` (INT): Foreign Key referencing `offence_categories`.
  - `reported_by` (INT): Foreign Key referencing `staff(staff_id)`.
  - `term_id` (INT): Foreign Key referencing `terms(term_id)`.
  - `status` (VARCHAR(20)): Incident lifecycle status (`'Reported'`, `'Under Investigation'`, `'Heard'`, `'Closed'`, `'Dismissed'`).

---

### Table 8: `incident_students` (Incident Involvement Link Table)
- **Purpose:** A single incident may involve multiple students in different roles (e.g., one offender, one victim, two witnesses). This many-to-many junction table handles complex involvement cleanly.
- **Key Columns:**
  - `involvement_id` (SERIAL PRIMARY KEY): Unique link record.
  - `incident_id` (INT): Foreign Key referencing `incidents`.
  - `student_id` (INT): Foreign Key referencing `students`.
  - `role_in_incident` (VARCHAR(15)): Restrained to `'Offender'`, `'Victim'`, `'Witness'`, or `'Accomplice'`.
  - `statement` (TEXT): Recorded statement provided by the student.

---

### Table 9: `investigations` (Formal Enquiry Records)
- **Purpose:** Used for serious or grave cases requiring detailed investigation before a hearing.
- **Key Columns:**
  - `investigation_id` (SERIAL PRIMARY KEY): Unique record ID.
  - `incident_id` (INT): Foreign Key referencing `incidents`.
  - `investigator_id` (INT): Foreign Key referencing `staff(staff_id)` (Discipline Master).
  - `findings` (TEXT), `recommendation` (VARCHAR(500)).

---

### Table 10: `sanctions` (Punishments & Corrective Actions)
- **Purpose:** Records formal penalties issued to offending students after a case hearing.
- **Key Columns:**
  - `sanction_id` (SERIAL PRIMARY KEY): Unique penalty record.
  - `incident_id` (INT): Foreign Key referencing `incidents`.
  - `student_id` (INT): Foreign Key referencing `students`.
  - `sanction_type` (VARCHAR(20)): Restrained to `'Verbal Warning'`, `'Written Warning'`, `'Detention'`, `'Manual Work'`, `'Suspension'`, `'Expulsion'`, or `'Parent Summons'`.
  - `status` (VARCHAR(10)): Restrained to `'Pending'`, `'Ongoing'`, `'Completed'`, `'Waived'`, or `'Appealed'`.

---

### Table 11: `suspensions` (Detailed Suspension Tracker)
- **Purpose:** Out-of-school suspensions require strict tracking of dates, return conditions, and parental notification.
- **Key Columns:**
  - `suspension_id` (SERIAL PRIMARY KEY): Unique suspension record.
  - `sanction_id` (INT UNIQUE): Foreign Key referencing `sanctions(sanction_id)`.
  - `days_suspended` (INT), `date_out` (DATE), `expected_return` (DATE), `actual_return` (DATE).
  - `conditions_for_return` (VARCHAR(300)): E.g., *"Must return accompanied by parent and signed pledge"*.
  - `parent_informed` (BOOLEAN): Flags whether parents received official notice.

---

### Table 12: `counselling_sessions` (Guidance & Support Records)
- **Purpose:** Tracks therapeutic and developmental support provided to students.
- **Key Columns:**
  - `session_id` (SERIAL PRIMARY KEY): Unique session ID.
  - `student_id` (INT): Foreign Key referencing `students`.
  - `counsellor_id` (INT): Foreign Key referencing `staff(staff_id)`.
  - `issues_discussed` (VARCHAR(500)), `agreed_actions` (VARCHAR(500)).
  - `is_confidential` (BOOLEAN): Default `TRUE`. Restricts reading permission to Counsellor & Head Teacher.

---

### Table 13: `merits` (Positive Conduct Commendations)
- **Purpose:** Discipline is not only punishment; positive behavior must be rewarded. Tracks merit points awarded to students.
- **Key Columns:**
  - `merit_id` (SERIAL PRIMARY KEY): Unique commendation ID.
  - `student_id` (INT): Foreign Key referencing `students`.
  - `term_id` (INT): Foreign Key referencing `terms`.
  - `merit_points` (SMALLINT): Point value (e.g., +1, +5).
  - `reason` (VARCHAR(255)): E.g., *"Helped organize school clean-up campaign"*.

---

### Table 14: `behaviour_summary` (Termly Conduct Scorecards)
- **Purpose:** Aggregates total incidents, total demerits, total merits, and computes an end-of-term conduct grade for report cards.
- **Key Columns:**
  - `summary_id` (SERIAL PRIMARY KEY): Unique summary ID.
  - `student_id` (INT), `term_id` (INT), `class_id` (INT).
  - `total_incidents` (INT), `total_demerits` (INT), `total_merits` (INT).
  - `conduct_grade` (VARCHAR(10)): Restrained to `'Excellent'`, `'Good'`, `'Fair'`, or `'Poor'`.

---

### Table 15: `parent_involvement` (Parent Communication Log)
- **Purpose:** Records communications, phone calls, letters, and face-to-face meetings with parents regarding discipline.
- **Key Columns:**
  - `involvement_id` (SERIAL PRIMARY KEY): Unique log ID.
  - `incident_id` (INT), `student_id` (INT).
  - `parent_name` (VARCHAR(100)), `contact_method` (VARCHAR(15) CHECK: `'Phone Call'`, `'SMS'`, `'Letter'`, `'Meeting'`).
  - `parent_response` (VARCHAR(500)).

---

### Table 16: `users` (System User Accounts)
- **Purpose:** Stores authenticated user login accounts linked to staff records.
- **Key Columns:**
  - `user_id` (SERIAL PRIMARY KEY): Unique user account ID.
  - `username` (VARCHAR(50) UNIQUE): Login handle (e.g., `"adong.grace"`).
  - `password_hash` (VARCHAR(255)): Secure Bcrypt cryptographic hash of the password.
  - `role` (VARCHAR(25)): System role (`'Administrator'`, `'Head Teacher'`, `'Deputy Head Teacher'`, `'Discipline Master'`, `'Counsellor'`, `'Class Teacher'`).
  - `linked_id` (INT): References `staff(staff_id)`.

---

### Table 17: `audit_log` (System Audit Trail)
- **Purpose:** Maintains an unalterable security history of user activities for accountability and fraud prevention.
- **Key Columns:**
  - `log_id` (BIGSERIAL PRIMARY KEY): Unique auto-increment log number.
  - `user_id` (INT): User who performed the action.
  - `action` (VARCHAR(30)): E.g., `'LOGIN'`, `'CREATE_INCIDENT'`, `'APPROVE_SUSPENSION'`.
  - `table_affected` (VARCHAR(60)), `record_id` (VARCHAR(40)), `details` (TEXT).
  - `action_time` (TIMESTAMP): Auto-generated server timestamp.

---

## 5. Technical Safeguards & Data Integrity Features

To ensure that human error cannot corrupt the database, `schema.sql` enforces strict database-level safeguards:

### 1. PostgreSQL `CHECK` Domain Constraints
Instead of allowing open text, specific fields restrict inputs at the database engine level:
```sql
CHECK (term_name IN ('Term 1','Term 2','Term 3'))
CHECK (school_level IN ('Nursery','Primary','Secondary'))
CHECK (severity_level IN ('Minor','Moderate','Serious','Grave'))
CHECK (role IN ('Administrator','Head Teacher','Deputy Head Teacher','Discipline Master','Counsellor','Class Teacher'))
```

### 2. High-Performance Indexing
Searching through thousands of records can slow down system performance. Indexes were created on high-frequency search fields to speed up queries:
```sql
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_date ON incidents(incident_date);
CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
```

---

## 6. Database Creation & Seeding Walkthrough

### Transactional Schema Execution (`database/schema.sql`)
The entire database design is contained within `schema.sql`. It uses database transaction blocks (`BEGIN; ... COMMIT;`) so that if any syntax error occurs, PostgreSQL rolls back completely, leaving no partial or broken tables behind.

### Realistic Demo Seeding (`backend/database/seeders/demo_seed.sql`)
To test the web application with realistic data, initial seed data was inserted:
- Active Academic Period: **Term 3 (2026)**
- Staff Profile: **Grace Adong** (Head Teacher, `STF-001`)
- Class Stream: **S.1 East** (Secondary Level)
- Student Profile: **Demo Student** (`GUL/2026/001`)
- Demo User Account: Username **`adong.grace`** with Bcrypt password hash for **`Grace@123`**.

### PostgreSQL Sequence Alignment Fix (`setval`)
When primary key IDs are inserted manually in SQL scripts, PostgreSQL's auto-increment counter (`SERIAL` sequence) does not update automatically. To prevent duplicate key errors when new users register later, explicit sequence realignment commands were executed:
```sql
SELECT setval(pg_get_serial_sequence('users', 'user_id'), (SELECT MAX(user_id) FROM users));
SELECT setval(pg_get_serial_sequence('students', 'student_id'), (SELECT MAX(student_id) FROM students));
```

---

## 7. Summary of Phase 1 Technical Accomplishments

| Milestone Component | Status | Implementation Detail |
|---|---|---|
| Architecture Definition | Completed | 3-Tier Client-Server model (React Web + Expo Mobile + PHP API + PostgreSQL) |
| Environment Setup | Completed | PHP 8.2 XAMPP, PostgreSQL 18, Node.js 24, Vite 5.4, Expo SDK 51 |
| Driver Configuration | Completed | `pdo_pgsql` enabled in XAMPP `php.ini` |
| Relational Schema | Completed | 17 normalized tables with 29 foreign keys created |
| Mobile Architecture | Completed | Expo manifest (`app.json`), Smart API client (`client.ts`), Expo UI (`App.tsx`), `start.ps1` |
| Data Safeguards | Completed | `CHECK` constraints, `UNIQUE` rules, and performance indexes |
| Data Seeding | Completed | Baseline operational test records loaded & sequences aligned |
