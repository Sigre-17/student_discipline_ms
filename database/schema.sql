-- =====================================================
-- STUDENT DISCIPLINE MANAGEMENT SYSTEM
-- PostgreSQL database schema for school_discipline_db
-- =====================================================

BEGIN;

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
    updated_at         TIMESTAMP,
    UNIQUE (incident_id, student_id)
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
    updated_at        TIMESTAMP,
    UNIQUE (student_id, term_id)
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
    action           VARCHAR(30) NOT NULL,
    table_affected   VARCHAR(60) NOT NULL,
    record_id        VARCHAR(40),
    details          TEXT,
    action_time      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE classes
    ADD CONSTRAINT fk_classes_class_teacher_id
    FOREIGN KEY (class_teacher_id) REFERENCES staff(staff_id);

ALTER TABLE students
    ADD CONSTRAINT fk_students_class_id
    FOREIGN KEY (class_id) REFERENCES classes(class_id);

ALTER TABLE school_rules
    ADD CONSTRAINT fk_school_rules_category_id
    FOREIGN KEY (category_id) REFERENCES offence_categories(category_id);

ALTER TABLE incidents
    ADD CONSTRAINT fk_incidents_category_id
    FOREIGN KEY (category_id) REFERENCES offence_categories(category_id);

ALTER TABLE incidents
    ADD CONSTRAINT fk_incidents_rule_id
    FOREIGN KEY (rule_id) REFERENCES school_rules(rule_id);

ALTER TABLE incidents
    ADD CONSTRAINT fk_incidents_reported_by
    FOREIGN KEY (reported_by) REFERENCES staff(staff_id);

ALTER TABLE incidents
    ADD CONSTRAINT fk_incidents_term_id
    FOREIGN KEY (term_id) REFERENCES terms(term_id);

ALTER TABLE incident_students
    ADD CONSTRAINT fk_incident_students_incident_id
    FOREIGN KEY (incident_id) REFERENCES incidents(incident_id);

ALTER TABLE incident_students
    ADD CONSTRAINT fk_incident_students_student_id
    FOREIGN KEY (student_id) REFERENCES students(student_id);

ALTER TABLE investigations
    ADD CONSTRAINT fk_investigations_incident_id
    FOREIGN KEY (incident_id) REFERENCES incidents(incident_id);

ALTER TABLE investigations
    ADD CONSTRAINT fk_investigations_investigator_id
    FOREIGN KEY (investigator_id) REFERENCES staff(staff_id);

ALTER TABLE sanctions
    ADD CONSTRAINT fk_sanctions_incident_id
    FOREIGN KEY (incident_id) REFERENCES incidents(incident_id);

ALTER TABLE sanctions
    ADD CONSTRAINT fk_sanctions_student_id
    FOREIGN KEY (student_id) REFERENCES students(student_id);

ALTER TABLE sanctions
    ADD CONSTRAINT fk_sanctions_issued_by
    FOREIGN KEY (issued_by) REFERENCES staff(staff_id);

ALTER TABLE suspensions
    ADD CONSTRAINT fk_suspensions_sanction_id
    FOREIGN KEY (sanction_id) REFERENCES sanctions(sanction_id);

ALTER TABLE suspensions
    ADD CONSTRAINT fk_suspensions_student_id
    FOREIGN KEY (student_id) REFERENCES students(student_id);

ALTER TABLE counselling_sessions
    ADD CONSTRAINT fk_counselling_sessions_student_id
    FOREIGN KEY (student_id) REFERENCES students(student_id);

ALTER TABLE counselling_sessions
    ADD CONSTRAINT fk_counselling_sessions_incident_id
    FOREIGN KEY (incident_id) REFERENCES incidents(incident_id);

ALTER TABLE counselling_sessions
    ADD CONSTRAINT fk_counselling_sessions_counsellor_id
    FOREIGN KEY (counsellor_id) REFERENCES staff(staff_id);

ALTER TABLE merits
    ADD CONSTRAINT fk_merits_student_id
    FOREIGN KEY (student_id) REFERENCES students(student_id);

ALTER TABLE merits
    ADD CONSTRAINT fk_merits_term_id
    FOREIGN KEY (term_id) REFERENCES terms(term_id);

ALTER TABLE merits
    ADD CONSTRAINT fk_merits_awarded_by
    FOREIGN KEY (awarded_by) REFERENCES staff(staff_id);

ALTER TABLE behaviour_summary
    ADD CONSTRAINT fk_behaviour_summary_student_id
    FOREIGN KEY (student_id) REFERENCES students(student_id);

ALTER TABLE behaviour_summary
    ADD CONSTRAINT fk_behaviour_summary_term_id
    FOREIGN KEY (term_id) REFERENCES terms(term_id);

ALTER TABLE behaviour_summary
    ADD CONSTRAINT fk_behaviour_summary_class_id
    FOREIGN KEY (class_id) REFERENCES classes(class_id);

ALTER TABLE parent_involvement
    ADD CONSTRAINT fk_parent_involvement_incident_id
    FOREIGN KEY (incident_id) REFERENCES incidents(incident_id);

ALTER TABLE parent_involvement
    ADD CONSTRAINT fk_parent_involvement_student_id
    FOREIGN KEY (student_id) REFERENCES students(student_id);

ALTER TABLE parent_involvement
    ADD CONSTRAINT fk_parent_involvement_handled_by
    FOREIGN KEY (handled_by) REFERENCES staff(staff_id);

ALTER TABLE audit_log
    ADD CONSTRAINT fk_audit_log_user_id
    FOREIGN KEY (user_id) REFERENCES users(user_id);

CREATE INDEX idx_classes_class_teacher_id ON classes(class_teacher_id);
CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_school_rules_category_id ON school_rules(category_id);
CREATE INDEX idx_incidents_category_id ON incidents(category_id);
CREATE INDEX idx_incidents_rule_id ON incidents(rule_id);
CREATE INDEX idx_incidents_reported_by ON incidents(reported_by);
CREATE INDEX idx_incidents_term_id ON incidents(term_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_date ON incidents(incident_date);
CREATE INDEX idx_incident_students_incident_id ON incident_students(incident_id);
CREATE INDEX idx_incident_students_student_id ON incident_students(student_id);
CREATE INDEX idx_investigations_incident_id ON investigations(incident_id);
CREATE INDEX idx_investigations_investigator_id ON investigations(investigator_id);
CREATE INDEX idx_sanctions_incident_id ON sanctions(incident_id);
CREATE INDEX idx_sanctions_student_id ON sanctions(student_id);
CREATE INDEX idx_sanctions_issued_by ON sanctions(issued_by);
CREATE INDEX idx_sanctions_status ON sanctions(status);
CREATE INDEX idx_suspensions_sanction_id ON suspensions(sanction_id);
CREATE INDEX idx_suspensions_student_id ON suspensions(student_id);
CREATE INDEX idx_counselling_sessions_student_id ON counselling_sessions(student_id);
CREATE INDEX idx_counselling_sessions_incident_id ON counselling_sessions(incident_id);
CREATE INDEX idx_counselling_sessions_counsellor_id ON counselling_sessions(counsellor_id);
CREATE INDEX idx_counselling_sessions_date ON counselling_sessions(session_date);
CREATE INDEX idx_merits_student_id ON merits(student_id);
CREATE INDEX idx_merits_term_id ON merits(term_id);
CREATE INDEX idx_behaviour_summary_student_id ON behaviour_summary(student_id);
CREATE INDEX idx_behaviour_summary_term_id ON behaviour_summary(term_id);
CREATE INDEX idx_parent_involvement_incident_id ON parent_involvement(incident_id);
CREATE INDEX idx_parent_involvement_student_id ON parent_involvement(student_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_action_time ON audit_log(action_time);
CREATE INDEX idx_staff_status ON staff(status);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_terms_is_current ON terms(is_current);

COMMIT;
