BEGIN;

-- 1. TERMS
INSERT INTO terms (term_id, academic_year, term_name, start_date, end_date, is_current)
VALUES 
    (1, '2026', 'Term 1', '2026-02-02', '2026-05-01', FALSE),
    (2, '2026', 'Term 2', '2026-05-25', '2026-08-14', FALSE),
    (3, '2026', 'Term 3', '2026-08-31', '2026-11-27', TRUE)
ON CONFLICT (term_id) DO UPDATE SET 
    academic_year = EXCLUDED.academic_year,
    term_name = EXCLUDED.term_name,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    is_current = EXCLUDED.is_current;

-- 2. STAFF
INSERT INTO staff (staff_id, staff_no, first_name, last_name, gender, email, phone, staff_type, status)
VALUES 
    (1, 'STF-001', 'Grace', 'Adong', 'Female', 'g.adong@gulusdms.ac.ug', '+256772111001', 'Administration', 'Active'),
    (2, 'STF-002', 'David', 'Okello', 'Male', 'd.okello@gulusdms.ac.ug', '+256772111002', 'Teaching', 'Active'),
    (3, 'STF-003', 'Sarah', 'Atwine', 'Female', 's.atwine@gulusdms.ac.ug', '+256772111003', 'Administration', 'Active'),
    (4, 'STF-004', 'Brian', 'Mugisha', 'Male', 'b.mugisha@gulusdms.ac.ug', '+256772111004', 'Teaching', 'Active'),
    (5, 'STF-005', 'Agnes', 'Kembabazi', 'Female', 'a.kembabazi@gulusdms.ac.ug', '+256772111005', 'Administration', 'Active'),
    (6, 'STF-006', 'System', 'Admin', 'Male', 'admin@gulusdms.ac.ug', '+256772111006', 'Administration', 'Active')
ON CONFLICT (staff_id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    email = EXCLUDED.email,
    staff_type = EXCLUDED.staff_type;

-- 3. CLASSES
INSERT INTO classes (class_id, class_name, stream, school_level, class_teacher_id, capacity)
VALUES 
    (1, 'S.1', 'East', 'Secondary', 4, 50),
    (2, 'S.2', 'North', 'Secondary', 2, 45),
    (3, 'S.3', 'Science', 'Secondary', 2, 40),
    (4, 'S.4', 'Arts', 'Secondary', 4, 40),
    (5, 'P.6', 'Blue', 'Primary', 1, 45),
    (6, 'P.7', 'Gold', 'Primary', 5, 50)
ON CONFLICT (class_id) DO UPDATE SET
    class_name = EXCLUDED.class_name,
    stream = EXCLUDED.stream,
    school_level = EXCLUDED.school_level,
    class_teacher_id = EXCLUDED.class_teacher_id,
    capacity = EXCLUDED.capacity;

-- 4. USERS (Bcrypt password for all demo accounts: Grace@123)
-- Password hash: $2y$10$Qb6uR.rlUIpbYIvxqmwyIesgxAaFHdvYLAyOj7.MtQeJQmJ4vzJUO
INSERT INTO users (user_id, username, password_hash, full_name, role, linked_id, is_active)
VALUES 
    (1, 'adong.grace', '$2y$10$trFE.MGlmrGdjgPov7qjCuyBqzmvTjc0zIJrjzDopPiLzOJpFERXW', 'Grace Adong', 'Head Teacher', 1, TRUE),
    (2, 'okello.david', '$2y$10$trFE.MGlmrGdjgPov7qjCuyBqzmvTjc0zIJrjzDopPiLzOJpFERXW', 'David Okello', 'Discipline Master', 2, TRUE),
    (3, 'atwine.sarah', '$2y$10$trFE.MGlmrGdjgPov7qjCuyBqzmvTjc0zIJrjzDopPiLzOJpFERXW', 'Sarah Atwine', 'Counsellor', 3, TRUE),
    (4, 'mugisha.brian', '$2y$10$trFE.MGlmrGdjgPov7qjCuyBqzmvTjc0zIJrjzDopPiLzOJpFERXW', 'Brian Mugisha', 'Class Teacher', 4, TRUE),
    (5, 'kembabazi.agnes', '$2y$10$trFE.MGlmrGdjgPov7qjCuyBqzmvTjc0zIJrjzDopPiLzOJpFERXW', 'Agnes Kembabazi', 'Deputy Head Teacher', 5, TRUE),
    (6, 'admin', '$2y$10$trFE.MGlmrGdjgPov7qjCuyBqzmvTjc0zIJrjzDopPiLzOJpFERXW', 'System Administrator', 'Administrator', 6, TRUE)
ON CONFLICT (user_id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    password_hash = EXCLUDED.password_hash;

-- 5. STUDENTS
INSERT INTO students (student_id, admission_no, first_name, last_name, date_of_birth, gender, school_level, class_id, status)
VALUES 
    (1, 'GUL/2026/001', 'Emmanuel', 'Ocen', '2012-05-10', 'Male', 'Secondary', 1, 'Active'),
    (2, 'GUL/2026/002', 'Faith', 'Akello', '2012-08-14', 'Female', 'Secondary', 1, 'Active'),
    (3, 'GUL/2026/003', 'Moses', 'Kiprotich', '2011-03-22', 'Male', 'Secondary', 2, 'Active'),
    (4, 'GUL/2026/004', 'Doreen', 'Namatovu', '2011-11-05', 'Female', 'Secondary', 2, 'Active'),
    (5, 'GUL/2026/005', 'Joshua', 'Kato', '2010-01-30', 'Male', 'Secondary', 3, 'Active'),
    (6, 'GUL/2026/006', 'Patricia', 'Auma', '2010-09-17', 'Female', 'Secondary', 3, 'Active'),
    (7, 'GUL/2026/007', 'Samuel', 'Lwanga', '2009-04-12', 'Male', 'Secondary', 4, 'Active'),
    (8, 'GUL/2026/008', 'Brenda', 'Nabirye', '2009-07-25', 'Female', 'Secondary', 4, 'Active'),
    (9, 'GUL/2026/009', 'Daniel', 'Opio', '2013-02-18', 'Male', 'Primary', 5, 'Active'),
    (10, 'GUL/2026/010', 'Mercy', 'Chebet', '2013-06-09', 'Female', 'Primary', 6, 'Active')
ON CONFLICT (student_id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    date_of_birth = EXCLUDED.date_of_birth,
    gender = EXCLUDED.gender,
    school_level = EXCLUDED.school_level,
    class_id = EXCLUDED.class_id;

-- 6. OFFENCE CATEGORIES
INSERT INTO offence_categories (category_id, category_name, severity_level, demerit_points, description)
VALUES 
    (1, 'Attendance and Punctuality', 'Minor', 1, 'Lateness to school or classes, unexcused absence from assemblies.'),
    (2, 'Uniform and Grooming', 'Minor', 1, 'Improper uniform, missing school badge, non-regulation footwear.'),
    (3, 'Classroom Disruption and Insolence', 'Minor', 2, 'Noise making, defiance of class teacher directives, disrupting learning.'),
    (4, 'Academic Dishonesty', 'Moderate', 3, 'Cheating during tests, plagiarism, unpermitted collaboration.'),
    (5, 'Bullying and Intimidation', 'Serious', 5, 'Physical, verbal, or psychological harassment of peers.'),
    (6, 'Vandalism and Property Damage', 'Serious', 5, 'Defacing school property, damaging desks, lab equipment, or textbooks.'),
    (7, 'Substance Abuse and Contraband', 'Grave', 10, 'Possession or consumption of prohibited substances or unauthorized mobile devices.'),
    (8, 'Physical Violence and Fighting', 'Grave', 10, 'Engaging in physical fights, assaults, or weapons possession.')
ON CONFLICT (category_id) DO UPDATE SET
    category_name = EXCLUDED.category_name,
    severity_level = EXCLUDED.severity_level,
    demerit_points = EXCLUDED.demerit_points,
    description = EXCLUDED.description;

-- 7. SCHOOL RULES
INSERT INTO school_rules (rule_id, category_id, rule_text, prescribed_sanction, applies_to_level, is_active)
VALUES 
    (1, 1, 'Learners must arrive at school by 7:30 AM for morning devotion and assembly.', 'Verbal Warning, detention on repeated breach', 'All', TRUE),
    (2, 2, 'Learners must be dressed in full, neat school uniform with designated black shoes.', 'Uniform correction, detention', 'All', TRUE),
    (3, 3, 'Learners must maintain order in classrooms and show respect to instructors and peers.', 'Written Warning, classroom exclusion', 'All', TRUE),
    (4, 4, 'Any form of cheating in assessments or examinations is strictly forbidden.', 'Cancel paper, Written Warning, Parent Summons', 'Secondary', TRUE),
    (5, 5, 'Bullying, extortion, intimidation, or cyber-harassment is completely prohibited.', 'Suspension, mandatory Counselling', 'All', TRUE),
    (6, 6, 'Defacing, breaking, or stealing school property is a severe offence.', 'Restitution of damaged property, Suspension', 'All', TRUE),
    (7, 7, 'Possession or consumption of alcohol, drugs, or tobacco products on school grounds is prohibited.', 'Immediate Suspension, Expulsion review', 'Secondary', TRUE),
    (8, 8, 'Physical violence, fighting, or weapon possession on school grounds is strictly illegal.', 'Suspension, Parent Summons, Expulsion', 'All', TRUE)
ON CONFLICT (rule_id) DO UPDATE SET
    rule_text = EXCLUDED.rule_text,
    prescribed_sanction = EXCLUDED.prescribed_sanction,
    applies_to_level = EXCLUDED.applies_to_level;

-- 8. INCIDENTS
INSERT INTO incidents (incident_id, incident_date, incident_time, location, category_id, rule_id, description, reported_by, term_id, status)
VALUES 
    (1, '2026-09-08', '08:15:00', 'Main Gate', 1, 1, 'Arrived 45 minutes late without a valid medical or parental permission slip.', 4, 3, 'Closed'),
    (2, '2026-09-12', '14:20:00', 'S.3 Block East', 6, 6, 'Carved graffiti on biology laboratory desks and broke a wooden stool.', 2, 3, 'Under Investigation'),
    (3, '2026-09-18', '11:00:00', 'Sports Pavilion', 8, 8, 'Physical altercation following an inter-house football debate.', 2, 3, 'Heard'),
    (4, '2026-09-22', '09:30:00', 'Library Corridor', 5, 5, 'Repeatedly taunted and confiscated lunch items from a junior S.1 student.', 3, 3, 'Reported')
ON CONFLICT (incident_id) DO UPDATE SET
    incident_date = EXCLUDED.incident_date,
    description = EXCLUDED.description,
    status = EXCLUDED.status;

-- 9. INCIDENT STUDENTS
INSERT INTO incident_students (involvement_id, incident_id, student_id, role_in_incident, statement, demerit_points)
VALUES 
    (1, 1, 1, 'Offender', 'Heavy rain delayed transport from town.', 1),
    (2, 2, 5, 'Offender', 'Admitted to doodling but denied breaking the stool.', 5),
    (3, 2, 6, 'Witness', 'Observed Joshua Kato carving into the wooden workbench.', 0),
    (4, 3, 7, 'Offender', 'Claimed provocation during an argument over match scores.', 10),
    (5, 3, 3, 'Victim', 'Sustained minor bruise, received first aid treatment.', 0),
    (6, 4, 5, 'Offender', 'Pending formal statement before the discipline committee.', 5)
ON CONFLICT (incident_id, student_id) DO UPDATE SET
    role_in_incident = EXCLUDED.role_in_incident,
    statement = EXCLUDED.statement,
    demerit_points = EXCLUDED.demerit_points;

-- 10. SANCTIONS
INSERT INTO sanctions (sanction_id, incident_id, student_id, sanction_type, details, start_date, end_date, issued_by, status)
VALUES 
    (1, 1, 1, 'Written Warning', 'Formal warning letter issued with copy placed in student file.', '2026-09-09', '2026-09-09', 4, 'Completed'),
    (2, 2, 5, 'Manual Work', 'Community service cleaning school compound for 3 afternoons.', '2026-09-15', '2026-09-17', 2, 'Completed'),
    (3, 3, 7, 'Suspension', '7-day suspension pending formal disciplinary board hearing with parents.', '2026-09-20', '2026-09-27', 1, 'Ongoing')
ON CONFLICT (sanction_id) DO UPDATE SET
    sanction_type = EXCLUDED.sanction_type,
    details = EXCLUDED.details,
    status = EXCLUDED.status;

-- 11. SUSPENSIONS
INSERT INTO suspensions (suspension_id, sanction_id, student_id, days_suspended, date_out, expected_return, conditions_for_return, parent_informed)
VALUES 
    (1, 3, 7, 7, '2026-09-20', '2026-09-27', 'Return accompanied by parent/guardian, written undertaking of good conduct, and guidance session with Counsellor.', TRUE)
ON CONFLICT (suspension_id) DO UPDATE SET
    days_suspended = EXCLUDED.days_suspended,
    expected_return = EXCLUDED.expected_return,
    conditions_for_return = EXCLUDED.conditions_for_return;

-- 12. COUNSELLING SESSIONS
INSERT INTO counselling_sessions (session_id, student_id, incident_id, counsellor_id, session_date, issues_discussed, agreed_actions, follow_up_date, is_confidential)
VALUES 
    (1, 1, 1, 3, '2026-09-10', 'Time management and morning travel obstacles discussed.', 'Student agreed to wake 30 minutes earlier and coordinate shared travel.', '2026-10-10', TRUE),
    (2, 5, 2, 3, '2026-09-16', 'Peer influence, expression of frustration in classroom.', 'Enrolled in school art club for constructive energy channeling.', '2026-10-05', TRUE),
    (3, 7, 3, 3, '2026-09-21', 'Anger management, coping with sporting competition stress.', 'Commitment to pause and call instructor instead of engaging physically.', '2026-10-12', TRUE)
ON CONFLICT (session_id) DO UPDATE SET
    issues_discussed = EXCLUDED.issues_discussed,
    agreed_actions = EXCLUDED.agreed_actions;

-- 13. MERITS
INSERT INTO merits (merit_id, student_id, term_id, reason, merit_points, awarded_by, award_date)
VALUES 
    (1, 2, 3, 'Outstanding leadership during school environmental cleanup day.', 3, 4, '2026-09-14'),
    (2, 4, 3, 'Honesty: Returned misplaced laboratory equipment to the science master.', 2, 2, '2026-09-17'),
    (3, 8, 3, 'Peer tutoring junior students in mathematics clinic.', 3, 1, '2026-09-23')
ON CONFLICT (merit_id) DO UPDATE SET
    reason = EXCLUDED.reason,
    merit_points = EXCLUDED.merit_points;

-- 14. BEHAVIOUR SUMMARY
INSERT INTO behaviour_summary (summary_id, student_id, term_id, class_id, total_incidents, total_demerits, total_merits, conduct_grade, remarks)
VALUES 
    (1, 1, 3, 1, 1, 1, 0, 'Good', 'Minor punctuality incident resolved after counselling.'),
    (2, 2, 3, 1, 0, 0, 3, 'Excellent', 'Exemplary conduct and positive leadership role model.'),
    (3, 3, 3, 2, 0, 0, 0, 'Good', 'Disciplined and orderly conduct in all school activities.'),
    (4, 5, 3, 3, 2, 10, 0, 'Fair', 'Needs close mentorship to deter disruptive impulses.'),
    (5, 7, 3, 4, 1, 10, 0, 'Poor', 'Currently on suspension; behaviour review scheduled after return.')
ON CONFLICT (student_id, term_id) DO UPDATE SET
    total_incidents = EXCLUDED.total_incidents,
    total_demerits = EXCLUDED.total_demerits,
    total_merits = EXCLUDED.total_merits,
    conduct_grade = EXCLUDED.conduct_grade,
    remarks = EXCLUDED.remarks;

-- 15. AUDIT LOG
INSERT INTO audit_log (user_id, action, table_affected, record_id, details, action_time)
VALUES 
    (1, 'SYSTEM_INIT', 'terms', '3', 'Academic Term 3 2026 activated as current term.', CURRENT_TIMESTAMP - INTERVAL '25 days'),
    (4, 'INSERT', 'incidents', '1', 'Reported morning gate punctuality infraction.', CURRENT_TIMESTAMP - INTERVAL '21 days'),
    (2, 'INSERT', 'incidents', '2', 'Filed vandalism report for S.3 classroom workbench.', CURRENT_TIMESTAMP - INTERVAL '17 days'),
    (2, 'INSERT', 'sanctions', '2', 'Assigned community manual work to student #5.', CURRENT_TIMESTAMP - INTERVAL '14 days'),
    (1, 'INSERT', 'suspensions', '1', 'Approved 7-day suspension for student #7 regarding sports fighting.', CURRENT_TIMESTAMP - INTERVAL '9 days'),
    (3, 'INSERT', 'counselling_sessions', '3', 'Conducted anger management counselling intake.', CURRENT_TIMESTAMP - INTERVAL '8 days')
ON CONFLICT DO NOTHING;

-- RESET SEQUENCES
SELECT setval(pg_get_serial_sequence('terms', 'term_id'), COALESCE((SELECT MAX(term_id) FROM terms), 1));
SELECT setval(pg_get_serial_sequence('staff', 'staff_id'), COALESCE((SELECT MAX(staff_id) FROM staff), 1));
SELECT setval(pg_get_serial_sequence('classes', 'class_id'), COALESCE((SELECT MAX(class_id) FROM classes), 1));
SELECT setval(pg_get_serial_sequence('students', 'student_id'), COALESCE((SELECT MAX(student_id) FROM students), 1));
SELECT setval(pg_get_serial_sequence('users', 'user_id'), COALESCE((SELECT MAX(user_id) FROM users), 1));
SELECT setval(pg_get_serial_sequence('offence_categories', 'category_id'), COALESCE((SELECT MAX(category_id) FROM offence_categories), 1));
SELECT setval(pg_get_serial_sequence('school_rules', 'rule_id'), COALESCE((SELECT MAX(rule_id) FROM school_rules), 1));
SELECT setval(pg_get_serial_sequence('incidents', 'incident_id'), COALESCE((SELECT MAX(incident_id) FROM incidents), 1));
SELECT setval(pg_get_serial_sequence('incident_students', 'involvement_id'), COALESCE((SELECT MAX(involvement_id) FROM incident_students), 1));
SELECT setval(pg_get_serial_sequence('sanctions', 'sanction_id'), COALESCE((SELECT MAX(sanction_id) FROM sanctions), 1));
SELECT setval(pg_get_serial_sequence('suspensions', 'suspension_id'), COALESCE((SELECT MAX(suspension_id) FROM suspensions), 1));
SELECT setval(pg_get_serial_sequence('counselling_sessions', 'session_id'), COALESCE((SELECT MAX(session_id) FROM counselling_sessions), 1));
SELECT setval(pg_get_serial_sequence('merits', 'merit_id'), COALESCE((SELECT MAX(merit_id) FROM merits), 1));
SELECT setval(pg_get_serial_sequence('behaviour_summary', 'summary_id'), COALESCE((SELECT MAX(summary_id) FROM behaviour_summary), 1));

COMMIT;
