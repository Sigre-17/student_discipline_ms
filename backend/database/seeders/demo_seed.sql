BEGIN;

INSERT INTO terms (term_id, academic_year, term_name, start_date, end_date, is_current)
VALUES (1, '2026', 'Term 3', '2026-08-31', '2026-11-27', TRUE);

INSERT INTO staff (staff_id, staff_no, first_name, last_name, gender, email, staff_type)
VALUES (1, 'STF-001', 'Grace', 'Adong', 'Female', 'g.adong@gulusdms.ac.ug', 'Administration');

INSERT INTO classes (class_id, class_name, stream, school_level, class_teacher_id, capacity)
VALUES (1, 'S.1', 'East', 'Secondary', 1, 50);

INSERT INTO students (student_id, admission_no, first_name, last_name, date_of_birth, gender, school_level, class_id)
VALUES (1, 'GUL/2026/001', 'Demo', 'Student', '2012-05-10', 'Male', 'Secondary', 1);

-- Password: Grace@123
INSERT INTO users (user_id, username, password_hash, full_name, role, linked_id)
VALUES (1, 'adong.grace', '$2y$10$Qb6uR.rlUIpbYIvxqmwyIesgxAaFHdvYLAyOj7.MtQeJQmJ4vzJUO', 'Grace Adong', 'Head Teacher', 1);

SELECT setval(pg_get_serial_sequence('terms', 'term_id'), (SELECT MAX(term_id) FROM terms));
SELECT setval(pg_get_serial_sequence('staff', 'staff_id'), (SELECT MAX(staff_id) FROM staff));
SELECT setval(pg_get_serial_sequence('classes', 'class_id'), (SELECT MAX(class_id) FROM classes));
SELECT setval(pg_get_serial_sequence('students', 'student_id'), (SELECT MAX(student_id) FROM students));
SELECT setval(pg_get_serial_sequence('users', 'user_id'), (SELECT MAX(user_id) FROM users));

COMMIT;
