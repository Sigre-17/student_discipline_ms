<?php

declare(strict_types=1);

namespace App\Http;

use App\Services\AuthService;
use PDO;
use Throwable;

final class ApiRouter
{
    public function __construct(
        private readonly PDO $database,
        private readonly AuthService $auth,
    ) {
    }

    public function handle(
        string $method,
        string $path,
        array $input = [],
        array $queryParams = [],
        string $token = ''
    ): array {
        try {
            // Public endpoints
            if ($method === 'POST' && $path === '/api/auth/login') {
                if (!isset($input['username'], $input['password'])) {
                    return $this->response(['message' => 'username and password are required'], 422);
                }
                return $this->response($this->auth->login((string) $input['username'], (string) $input['password']));
            }

            if ($method === 'GET' && $path === '/api/tables') {
                return $this->response(['tables' => $this->tableNames()]);
            }

            if ($method === 'GET' && $path === '/api/seed-status') {
                return $this->response(['counts' => $this->seedCounts()]);
            }

            // Public: list seeded test user credentials (no passwords) for dev/demo login screen
            if ($method === 'GET' && $path === '/api/test-credentials') {
                $stmt = $this->database->query(
                    "SELECT u.user_id, u.username, u.full_name, u.role, s.email
                     FROM users u
                     LEFT JOIN staff s ON s.staff_id = u.linked_id
                     WHERE u.is_active = TRUE
                     ORDER BY u.user_id"
                );
                $users = $stmt->fetchAll();
                return $this->response(['credentials' => $users]);
            }

            // Authenticate token for protected routes
            $user = null;
            if ($token !== '') {
                $user = $this->auth->validateToken($token);
            }

            // Current user info
            if ($method === 'GET' && $path === '/api/auth/me') {
                if (!$user) {
                    return $this->response(['message' => 'Unauthorized: Invalid or missing token.'], 401);
                }
                return $this->response(['user' => $user]);
            }

            // Dashboard statistics
            if ($method === 'GET' && $path === '/api/dashboard/stats') {
                return $this->response($this->dashboardStats());
            }

            // Classes & Terms
            if ($method === 'GET' && $path === '/api/classes') {
                return $this->response(['classes' => $this->getClasses()]);
            }

            if ($method === 'GET' && $path === '/api/terms') {
                return $this->response(['terms' => $this->getTerms()]);
            }

            // Offence Categories & Rules
            if ($method === 'GET' && $path === '/api/offence-categories') {
                return $this->response(['categories' => $this->getOffenceCategories()]);
            }

            if ($method === 'GET' && $path === '/api/school-rules') {
                return $this->response(['rules' => $this->getSchoolRules($queryParams)]);
            }

            // Staff & Users
            if ($method === 'GET' && $path === '/api/staff') {
                return $this->response(['staff' => $this->getStaff()]);
            }

            if ($method === 'GET' && $path === '/api/users') {
                return $this->response(['users' => $this->getUsers()]);
            }

            // Students
            if ($method === 'GET' && $path === '/api/students') {
                return $this->response(['students' => $this->getStudents($queryParams)]);
            }

            if ($method === 'POST' && $path === '/api/students') {
                return $this->createStudent($input, $user);
            }

            if ($method === 'GET' && preg_match('#^/api/students/(\d+)$#', $path, $matches)) {
                return $this->getStudentProfile((int) $matches[1], $user);
            }

            // Incidents
            if ($method === 'GET' && $path === '/api/incidents') {
                return $this->response(['incidents' => $this->getIncidents($queryParams)]);
            }

            if ($method === 'POST' && $path === '/api/incidents') {
                return $this->createIncident($input, $user);
            }

            if ($method === 'GET' && preg_match('#^/api/incidents/(\d+)$#', $path, $matches)) {
                return $this->getIncidentDetails((int) $matches[1]);
            }

            if ($method === 'PUT' && preg_match('#^/api/incidents/(\d+)/status$#', $path, $matches)) {
                return $this->updateIncidentStatus((int) $matches[1], $input, $user);
            }

            // Sanctions
            if ($method === 'GET' && $path === '/api/sanctions') {
                return $this->response(['sanctions' => $this->getSanctions($queryParams)]);
            }

            if ($method === 'POST' && $path === '/api/sanctions') {
                return $this->createSanction($input, $user);
            }

            if ($method === 'PUT' && preg_match('#^/api/sanctions/(\d+)$#', $path, $matches)) {
                return $this->updateSanction((int) $matches[1], $input, $user);
            }

            // Counselling Sessions
            if ($method === 'GET' && $path === '/api/counselling') {
                return $this->response(['sessions' => $this->getCounsellingSessions($user)]);
            }

            if ($method === 'POST' && $path === '/api/counselling') {
                return $this->createCounsellingSession($input, $user);
            }

            // Merits
            if ($method === 'GET' && $path === '/api/merits') {
                return $this->response(['merits' => $this->getMerits($queryParams)]);
            }

            if ($method === 'POST' && $path === '/api/merits') {
                return $this->createMerit($input, $user);
            }

            // Audit Logs
            if ($method === 'GET' && $path === '/api/audit-logs') {
                return $this->response(['logs' => $this->getAuditLogs()]);
            }

            return $this->response(['message' => 'Route not found: ' . $method . ' ' . $path], 404);
        } catch (Throwable $exception) {
            $status = $exception->getMessage() === 'Invalid username or password.' ? 401 : 500;
            return $this->response([
                'message' => $exception->getMessage(),
                'file' => basename($exception->getFile()),
                'line' => $exception->getLine()
            ], $status);
        }
    }

    private function dashboardStats(): array
    {
        $currentTerm = $this->database->query(
            "SELECT term_id, academic_year, term_name FROM terms WHERE is_current = TRUE LIMIT 1"
        )->fetch() ?: ['term_id' => 1, 'academic_year' => '2026', 'term_name' => 'Term 3'];

        $termId = (int) $currentTerm['term_id'];

        // Totals
        $studentsCount = (int) $this->database->query("SELECT COUNT(*) FROM students WHERE status = 'Active'")->fetchColumn();
        $staffCount = (int) $this->database->query("SELECT COUNT(*) FROM staff WHERE status = 'Active'")->fetchColumn();
        $classesCount = (int) $this->database->query("SELECT COUNT(*) FROM classes")->fetchColumn();
        $incidentsCount = (int) $this->database->query("SELECT COUNT(*) FROM incidents")->fetchColumn();
        $openIncidentsCount = (int) $this->database->query("SELECT COUNT(*) FROM incidents WHERE status IN ('Reported', 'Under Investigation', 'Heard')")->fetchColumn();
        $activeSanctionsCount = (int) $this->database->query("SELECT COUNT(*) FROM sanctions WHERE status IN ('Pending', 'Ongoing')")->fetchColumn();
        $suspensionsCount = (int) $this->database->query("SELECT COUNT(*) FROM suspensions WHERE actual_return IS NULL")->fetchColumn();
        $counsellingCount = (int) $this->database->query("SELECT COUNT(*) FROM counselling_sessions")->fetchColumn();
        $meritsCount = (int) $this->database->query("SELECT COUNT(*) FROM merits")->fetchColumn();

        // Incidents by severity
        $severityQuery = $this->database->query("
            SELECT oc.severity_level, COUNT(i.incident_id) as count
            FROM offence_categories oc
            LEFT JOIN incidents i ON oc.category_id = i.category_id
            GROUP BY oc.severity_level
        ")->fetchAll();
        $severityMap = ['Minor' => 0, 'Moderate' => 0, 'Serious' => 0, 'Grave' => 0];
        foreach ($severityQuery as $row) {
            $severityMap[$row['severity_level']] = (int) $row['count'];
        }

        // Incidents by status
        $statusQuery = $this->database->query("
            SELECT status, COUNT(*) as count FROM incidents GROUP BY status
        ")->fetchAll();
        $statusMap = ['Reported' => 0, 'Under Investigation' => 0, 'Heard' => 0, 'Closed' => 0, 'Dismissed' => 0];
        foreach ($statusQuery as $row) {
            $statusMap[$row['status']] = (int) $row['count'];
        }

        // Recent Incidents
        $recentIncidents = $this->database->query("
            SELECT i.incident_id, i.incident_date, i.status, i.location,
                   oc.category_name, oc.severity_level,
                   st.first_name || ' ' || st.last_name as reported_by_name,
                   COUNT(ins.student_id) as involved_count
            FROM incidents i
            JOIN offence_categories oc ON i.category_id = oc.category_id
            JOIN staff st ON i.reported_by = st.staff_id
            LEFT JOIN incident_students ins ON i.incident_id = ins.incident_id
            GROUP BY i.incident_id, i.incident_date, i.status, i.location, oc.category_name, oc.severity_level, st.first_name, st.last_name
            ORDER BY i.incident_date DESC, i.incident_id DESC
            LIMIT 5
        ")->fetchAll();

        // Conduct Grade distribution
        $conductQuery = $this->database->query("
            SELECT conduct_grade, COUNT(*) as count 
            FROM behaviour_summary 
            WHERE term_id = $termId 
            GROUP BY conduct_grade
        ")->fetchAll();
        $conductMap = ['Excellent' => 0, 'Good' => 0, 'Fair' => 0, 'Poor' => 0];
        foreach ($conductQuery as $row) {
            if ($row['conduct_grade']) {
                $conductMap[$row['conduct_grade']] = (int) $row['count'];
            }
        }

        return [
            'current_term' => $currentTerm,
            'counts' => [
                'students' => $studentsCount,
                'staff' => $staffCount,
                'classes' => $classesCount,
                'incidents' => $incidentsCount,
                'open_incidents' => $openIncidentsCount,
                'active_sanctions' => $activeSanctionsCount,
                'active_suspensions' => $suspensionsCount,
                'counselling_sessions' => $counsellingCount,
                'merits' => $meritsCount,
            ],
            'by_severity' => $severityMap,
            'by_status' => $statusMap,
            'conduct_grades' => $conductMap,
            'recent_incidents' => $recentIncidents,
        ];
    }

    private function getClasses(): array
    {
        $stmt = $this->database->query("
            SELECT c.class_id, c.class_name, c.stream, c.school_level, c.capacity,
                   st.first_name || ' ' || st.last_name as class_teacher_name,
                   COUNT(s.student_id) as student_count
            FROM classes c
            LEFT JOIN staff st ON c.class_teacher_id = st.staff_id
            LEFT JOIN students s ON c.class_id = s.class_id AND s.status = 'Active'
            GROUP BY c.class_id, c.class_name, c.stream, c.school_level, c.capacity, st.first_name, st.last_name
            ORDER BY c.school_level, c.class_name, c.stream
        ");
        return $stmt->fetchAll();
    }

    private function getTerms(): array
    {
        return $this->database->query(
            "SELECT term_id, academic_year, term_name, start_date, end_date, is_current FROM terms ORDER BY start_date DESC"
        )->fetchAll();
    }

    private function getOffenceCategories(): array
    {
        return $this->database->query(
            "SELECT category_id, category_name, severity_level, demerit_points, description FROM offence_categories ORDER BY severity_level, category_name"
        )->fetchAll();
    }

    private function getSchoolRules(array $params): array
    {
        $sql = "
            SELECT r.rule_id, r.rule_text, r.prescribed_sanction, r.applies_to_level, r.is_active,
                   c.category_name, c.severity_level, c.demerit_points
            FROM school_rules r
            JOIN offence_categories c ON r.category_id = c.category_id
            WHERE r.is_active = TRUE
        ";
        if (!empty($params['level'])) {
            $sql .= " AND (r.applies_to_level = 'All' OR r.applies_to_level = " . $this->database->quote($params['level']) . ")";
        }
        $sql .= " ORDER BY c.severity_level, r.rule_id";
        return $this->database->query($sql)->fetchAll();
    }

    private function getStaff(): array
    {
        return $this->database->query("
            SELECT staff_id, staff_no, first_name, last_name, gender, email, phone, staff_type, status
            FROM staff WHERE status = 'Active' ORDER BY first_name, last_name
        ")->fetchAll();
    }

    private function getUsers(): array
    {
        return $this->database->query("
            SELECT user_id, username, full_name, role, linked_id, is_active, last_login, created_at
            FROM users ORDER BY full_name
        ")->fetchAll();
    }

    private function getStudents(array $params): array
    {
        $sql = "
            SELECT s.student_id, s.admission_no, s.first_name, s.last_name, s.date_of_birth, s.gender,
                   s.school_level, s.class_id, s.status,
                   c.class_name, c.stream,
                   COALESCE(bs.total_incidents, 0) as total_incidents,
                   COALESCE(bs.total_demerits, 0) as total_demerits,
                   COALESCE(bs.total_merits, 0) as total_merits,
                   COALESCE(bs.conduct_grade, 'Good') as conduct_grade
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.class_id
            LEFT JOIN behaviour_summary bs ON s.student_id = bs.student_id AND bs.term_id = (SELECT term_id FROM terms WHERE is_current = TRUE LIMIT 1)
            WHERE 1=1
        ";

        if (!empty($params['class_id'])) {
            $sql .= " AND s.class_id = " . (int) $params['class_id'];
        }
        if (!empty($params['school_level'])) {
            $sql .= " AND s.school_level = " . $this->database->quote($params['school_level']);
        }
        if (!empty($params['search'])) {
            $term = $this->database->quote('%' . $params['search'] . '%');
            $sql .= " AND (s.first_name ILIKE $term OR s.last_name ILIKE $term OR s.admission_no ILIKE $term)";
        }

        $sql .= " ORDER BY s.first_name, s.last_name";
        return $this->database->query($sql)->fetchAll();
    }

    private function createStudent(array $input, ?array $user): array
    {
        if (empty($input['admission_no']) || empty($input['first_name']) || empty($input['last_name'])) {
            return $this->response(['message' => 'Admission number, first name, and last name are required.'], 422);
        }

        $stmt = $this->database->prepare("
            INSERT INTO students (admission_no, first_name, last_name, date_of_birth, gender, school_level, class_id, status)
            VALUES (:adm, :fn, :ln, :dob, :gender, :level, :class_id, 'Active')
            RETURNING student_id
        ");
        $stmt->execute([
            'adm' => trim($input['admission_no']),
            'fn' => trim($input['first_name']),
            'ln' => trim($input['last_name']),
            'dob' => $input['date_of_birth'] ?? '2012-01-01',
            'gender' => $input['gender'] ?? 'Male',
            'level' => $input['school_level'] ?? 'Secondary',
            'class_id' => !empty($input['class_id']) ? (int) $input['class_id'] : null,
        ]);
        $id = $stmt->fetchColumn();

        $this->auth->logAudit(
            $user['sub'] ?? null,
            'INSERT',
            'students',
            (string) $id,
            "Enrolled student {$input['first_name']} {$input['last_name']} ({$input['admission_no']})"
        );

        return $this->response(['message' => 'Student enrolled successfully.', 'student_id' => $id], 201);
    }

    private function getStudentProfile(int $studentId, ?array $user): array
    {
        $stmt = $this->database->prepare("
            SELECT s.*, c.class_name, c.stream,
                   st.first_name || ' ' || st.last_name as class_teacher_name
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.class_id
            LEFT JOIN staff st ON c.class_teacher_id = st.staff_id
            WHERE s.student_id = :id
        ");
        $stmt->execute(['id' => $studentId]);
        $student = $stmt->fetch();
        if (!$student) {
            return $this->response(['message' => 'Student not found.'], 404);
        }

        // Behaviour Summary
        $summary = $this->database->query("
            SELECT bs.*, t.term_name, t.academic_year
            FROM behaviour_summary bs
            JOIN terms t ON bs.term_id = t.term_id
            WHERE bs.student_id = $studentId
            ORDER BY t.start_date DESC
        ")->fetchAll();

        // Incidents involved in
        $incidents = $this->database->query("
            SELECT i.incident_id, i.incident_date, i.location, i.status,
                   oc.category_name, oc.severity_level,
                   ins.role_in_incident, ins.statement, ins.demerit_points
            FROM incident_students ins
            JOIN incidents i ON ins.incident_id = i.incident_id
            JOIN offence_categories oc ON i.category_id = oc.category_id
            WHERE ins.student_id = $studentId
            ORDER BY i.incident_date DESC
        ")->fetchAll();

        // Sanctions
        $sanctions = $this->database->query("
            SELECT s.*, i.incident_date, oc.category_name,
                   st.first_name || ' ' || st.last_name as issued_by_name
            FROM sanctions s
            JOIN incidents i ON s.incident_id = i.incident_id
            JOIN offence_categories oc ON i.category_id = oc.category_id
            LEFT JOIN staff st ON s.issued_by = st.staff_id
            WHERE s.student_id = $studentId
            ORDER BY s.created_at DESC
        ")->fetchAll();

        // Suspensions
        $suspensions = $this->database->query("
            SELECT sp.* FROM suspensions sp WHERE sp.student_id = $studentId ORDER BY sp.date_out DESC
        ")->fetchAll();

        // Merits
        $merits = $this->database->query("
            SELECT m.*, st.first_name || ' ' || st.last_name as awarded_by_name
            FROM merits m
            LEFT JOIN staff st ON m.awarded_by = st.staff_id
            WHERE m.student_id = $studentId
            ORDER BY m.award_date DESC
        ")->fetchAll();

        // Counselling (role-protected)
        $userRole = $user['role'] ?? '';
        $canSeeCounselling = in_array($userRole, ['Head Teacher', 'Deputy Head Teacher', 'Counsellor', 'Administrator'], true);
        $counselling = [];
        if ($canSeeCounselling) {
            $counselling = $this->database->query("
                SELECT cs.*, st.first_name || ' ' || st.last_name as counsellor_name
                FROM counselling_sessions cs
                JOIN staff st ON cs.counsellor_id = st.staff_id
                WHERE cs.student_id = $studentId
                ORDER BY cs.session_date DESC
            ")->fetchAll();
        }

        return $this->response([
            'student' => $student,
            'summary' => $summary,
            'incidents' => $incidents,
            'sanctions' => $sanctions,
            'suspensions' => $suspensions,
            'merits' => $merits,
            'counselling' => $counselling,
        ]);
    }

    private function getIncidents(array $params): array
    {
        $sql = "
            SELECT i.incident_id, i.incident_date, i.incident_time, i.location, i.status, i.description,
                   oc.category_name, oc.severity_level, oc.demerit_points as default_demerits,
                   sr.rule_text, sr.prescribed_sanction,
                   st.first_name || ' ' || st.last_name as reported_by_name,
                   t.term_name || ' ' || t.academic_year as term_label,
                   COUNT(ins.student_id) as total_students_involved,
                   STRING_AGG(DISTINCT s.first_name || ' ' || s.last_name || ' (' || ins.role_in_incident || ')', ', ') as involved_students_summary
            FROM incidents i
            JOIN offence_categories oc ON i.category_id = oc.category_id
            LEFT JOIN school_rules sr ON i.rule_id = sr.rule_id
            JOIN staff st ON i.reported_by = st.staff_id
            JOIN terms t ON i.term_id = t.term_id
            LEFT JOIN incident_students ins ON i.incident_id = ins.incident_id
            LEFT JOIN students s ON ins.student_id = s.student_id
            WHERE 1=1
        ";

        if (!empty($params['status'])) {
            $sql .= " AND i.status = " . $this->database->quote($params['status']);
        }
        if (!empty($params['severity'])) {
            $sql .= " AND oc.severity_level = " . $this->database->quote($params['severity']);
        }
        if (!empty($params['search'])) {
            $term = $this->database->quote('%' . $params['search'] . '%');
            $sql .= " AND (i.description ILIKE $term OR oc.category_name ILIKE $term OR i.location ILIKE $term)";
        }

        $sql .= " GROUP BY i.incident_id, i.incident_date, i.incident_time, i.location, i.status, i.description,
                           oc.category_name, oc.severity_level, oc.demerit_points, sr.rule_text, sr.prescribed_sanction,
                           st.first_name, st.last_name, t.term_name, t.academic_year
                  ORDER BY i.incident_date DESC, i.incident_id DESC";

        return $this->database->query($sql)->fetchAll();
    }

    private function getIncidentDetails(int $id): array
    {
        $stmt = $this->database->prepare("
            SELECT i.*, oc.category_name, oc.severity_level, oc.demerit_points,
                   sr.rule_text, sr.prescribed_sanction,
                   st.first_name || ' ' || st.last_name as reported_by_name,
                   t.term_name || ' ' || t.academic_year as term_label
            FROM incidents i
            JOIN offence_categories oc ON i.category_id = oc.category_id
            LEFT JOIN school_rules sr ON i.rule_id = sr.rule_id
            JOIN staff st ON i.reported_by = st.staff_id
            JOIN terms t ON i.term_id = t.term_id
            WHERE i.incident_id = :id
        ");
        $stmt->execute(['id' => $id]);
        $incident = $stmt->fetch();
        if (!$incident) {
            return $this->response(['message' => 'Incident not found.'], 404);
        }

        // Students involved
        $students = $this->database->query("
            SELECT ins.*, s.admission_no, s.first_name, s.last_name, s.gender, c.class_name, c.stream
            FROM incident_students ins
            JOIN students s ON ins.student_id = s.student_id
            LEFT JOIN classes c ON s.class_id = c.class_id
            WHERE ins.incident_id = $id
        ")->fetchAll();

        // Sanctions issued for this incident
        $sanctions = $this->database->query("
            SELECT sn.*, s.first_name || ' ' || s.last_name as student_name
            FROM sanctions sn
            JOIN students s ON sn.student_id = s.student_id
            WHERE sn.incident_id = $id
        ")->fetchAll();

        return $this->response([
            'incident' => $incident,
            'students' => $students,
            'sanctions' => $sanctions,
        ]);
    }

    private function createIncident(array $input, ?array $user): array
    {
        if (empty($input['category_id']) || empty($input['description'])) {
            return $this->response(['message' => 'category_id and description are required.'], 422);
        }

        $termId = (int) ($input['term_id'] ?? $this->database->query("SELECT term_id FROM terms WHERE is_current = TRUE LIMIT 1")->fetchColumn() ?: 1);
        $reportedBy = (int) ($input['reported_by'] ?? ($user['sub'] ?? 1));

        // Get reporter's staff_id
        $staffId = (int) $this->database->query("SELECT linked_id FROM users WHERE user_id = $reportedBy")->fetchColumn() ?: 1;

        $stmt = $this->database->prepare("
            INSERT INTO incidents (incident_date, incident_time, location, category_id, rule_id, description, reported_by, term_id, status)
            VALUES (:date, :time, :location, :category_id, :rule_id, :desc, :reported_by, :term_id, :status)
            RETURNING incident_id
        ");
        $stmt->execute([
            'date' => $input['incident_date'] ?? date('Y-m-d'),
            'time' => $input['incident_time'] ?? date('H:i:s'),
            'location' => $input['location'] ?? 'School Grounds',
            'category_id' => (int) $input['category_id'],
            'rule_id' => !empty($input['rule_id']) ? (int) $input['rule_id'] : null,
            'desc' => trim($input['description']),
            'reported_by' => $staffId,
            'term_id' => $termId,
            'status' => $input['status'] ?? 'Reported',
        ]);
        $incidentId = (int) $stmt->fetchColumn();

        // Attach involved students
        if (!empty($input['students']) && is_array($input['students'])) {
            $studentStmt = $this->database->prepare("
                INSERT INTO incident_students (incident_id, student_id, role_in_incident, statement, demerit_points)
                VALUES (:inc_id, :st_id, :role, :statement, :demerits)
                ON CONFLICT (incident_id, student_id) DO NOTHING
            ");

            foreach ($input['students'] as $st) {
                $studentId = (int) ($st['student_id'] ?? $st);
                $role = $st['role_in_incident'] ?? 'Offender';
                $statement = $st['statement'] ?? null;
                $demerits = isset($st['demerit_points']) ? (int) $st['demerit_points'] : (int) $this->database->query("SELECT demerit_points FROM offence_categories WHERE category_id = " . (int)$input['category_id'])->fetchColumn();

                $studentStmt->execute([
                    'inc_id' => $incidentId,
                    'st_id' => $studentId,
                    'role' => $role,
                    'statement' => $statement,
                    'demerits' => $role === 'Offender' ? $demerits : 0,
                ]);

                // Update behaviour summary for offenders
                if ($role === 'Offender') {
                    $this->updateStudentBehaviourSummary($studentId, $termId, 1, $demerits, 0);
                }
            }
        }

        $this->auth->logAudit(
            $user['sub'] ?? null,
            'INSERT',
            'incidents',
            (string) $incidentId,
            "Logged incident #$incidentId: {$input['description']}"
        );

        return $this->response([
            'message' => 'Incident reported successfully.',
            'incident_id' => $incidentId
        ], 201);
    }

    private function updateIncidentStatus(int $id, array $input, ?array $user): array
    {
        if (empty($input['status'])) {
            return $this->response(['message' => 'Status is required.'], 422);
        }

        $stmt = $this->database->prepare("UPDATE incidents SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE incident_id = :id");
        $stmt->execute(['status' => $input['status'], 'id' => $id]);

        $this->auth->logAudit(
            $user['sub'] ?? null,
            'UPDATE',
            'incidents',
            (string) $id,
            "Updated incident #$id status to {$input['status']}"
        );

        return $this->response(['message' => 'Incident status updated.']);
    }

    private function getSanctions(array $params): array
    {
        $sql = "
            SELECT sn.sanction_id, sn.sanction_type, sn.details, sn.start_date, sn.end_date, sn.status, sn.created_at,
                   s.student_id, s.first_name || ' ' || s.last_name as student_name, s.admission_no,
                   c.class_name, c.stream,
                   i.incident_id, i.incident_date, oc.category_name,
                   st.first_name || ' ' || st.last_name as issued_by_name,
                   sp.days_suspended, sp.expected_return, sp.conditions_for_return
            FROM sanctions sn
            JOIN students s ON sn.student_id = s.student_id
            LEFT JOIN classes c ON s.class_id = c.class_id
            JOIN incidents i ON sn.incident_id = i.incident_id
            JOIN offence_categories oc ON i.category_id = oc.category_id
            LEFT JOIN staff st ON sn.issued_by = st.staff_id
            LEFT JOIN suspensions sp ON sn.sanction_id = sp.sanction_id
            WHERE 1=1
        ";

        if (!empty($params['status'])) {
            $sql .= " AND sn.status = " . $this->database->quote($params['status']);
        }
        if (!empty($params['sanction_type'])) {
            $sql .= " AND sn.sanction_type = " . $this->database->quote($params['sanction_type']);
        }

        $sql .= " ORDER BY sn.created_at DESC";
        return $this->database->query($sql)->fetchAll();
    }

    private function createSanction(array $input, ?array $user): array
    {
        if (empty($input['incident_id']) || empty($input['student_id']) || empty($input['sanction_type'])) {
            return $this->response(['message' => 'incident_id, student_id, and sanction_type are required.'], 422);
        }

        $issuedBy = (int) ($input['issued_by'] ?? ($user['sub'] ?? 1));
        $staffId = (int) $this->database->query("SELECT linked_id FROM users WHERE user_id = $issuedBy")->fetchColumn() ?: 1;

        $stmt = $this->database->prepare("
            INSERT INTO sanctions (incident_id, student_id, sanction_type, details, start_date, end_date, issued_by, status)
            VALUES (:inc_id, :st_id, :type, :details, :start, :end, :issued_by, :status)
            RETURNING sanction_id
        ");
        $stmt->execute([
            'inc_id' => (int) $input['incident_id'],
            'st_id' => (int) $input['student_id'],
            'type' => $input['sanction_type'],
            'details' => $input['details'] ?? '',
            'start' => $input['start_date'] ?? date('Y-m-d'),
            'end' => $input['end_date'] ?? date('Y-m-d', strtotime('+3 days')),
            'issued_by' => $staffId,
            'status' => $input['status'] ?? 'Pending',
        ]);
        $sanctionId = (int) $stmt->fetchColumn();

        // If suspension, record suspension order
        if ($input['sanction_type'] === 'Suspension') {
            $days = (int) ($input['days_suspended'] ?? 7);
            $dateOut = $input['start_date'] ?? date('Y-m-d');
            $expectedReturn = date('Y-m-d', strtotime("+$days days", strtotime($dateOut)));

            $suspStmt = $this->database->prepare("
                INSERT INTO suspensions (sanction_id, student_id, days_suspended, date_out, expected_return, conditions_for_return, parent_informed)
                VALUES (:sn_id, :st_id, :days, :date_out, :expected, :conditions, TRUE)
            ");
            $suspStmt->execute([
                'sn_id' => $sanctionId,
                'st_id' => (int) $input['student_id'],
                'days' => $days,
                'date_out' => $dateOut,
                'expected' => $expectedReturn,
                'conditions' => $input['conditions_for_return'] ?? 'Parent summons and written undertaking of good conduct.',
            ]);
        }

        $this->auth->logAudit(
            $user['sub'] ?? null,
            'INSERT',
            'sanctions',
            (string) $sanctionId,
            "Issued {$input['sanction_type']} to student #{$input['student_id']}"
        );

        return $this->response([
            'message' => 'Sanction issued successfully.',
            'sanction_id' => $sanctionId,
        ], 201);
    }

    private function updateSanction(int $id, array $input, ?array $user): array
    {
        if (empty($input['status'])) {
            return $this->response(['message' => 'status is required.'], 422);
        }

        $stmt = $this->database->prepare("
            UPDATE sanctions SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE sanction_id = :id
        ");
        $stmt->execute(['status' => $input['status'], 'id' => $id]);

        $this->auth->logAudit(
            $user['sub'] ?? null,
            'UPDATE',
            'sanctions',
            (string) $id,
            "Updated sanction #$id status to {$input['status']}"
        );

        return $this->response(['message' => 'Sanction status updated.']);
    }

    private function getCounsellingSessions(?array $user): array
    {
        $role = $user['role'] ?? 'Head Teacher';
        // RBAC: Counsellor, Head Teacher, Deputy, Administrator
        $allowed = ['Head Teacher', 'Deputy Head Teacher', 'Counsellor', 'Administrator'];
        if (!in_array($role, $allowed, true)) {
            return [];
        }

        return $this->database->query("
            SELECT cs.session_id, cs.session_date, cs.issues_discussed, cs.agreed_actions, cs.follow_up_date, cs.is_confidential,
                   s.student_id, s.first_name || ' ' || s.last_name as student_name, s.admission_no,
                   c.class_name,
                   st.first_name || ' ' || st.last_name as counsellor_name
            FROM counselling_sessions cs
            JOIN students s ON cs.student_id = s.student_id
            LEFT JOIN classes c ON s.class_id = c.class_id
            JOIN staff st ON cs.counsellor_id = st.staff_id
            ORDER BY cs.session_date DESC
        ")->fetchAll();
    }

    private function createCounsellingSession(array $input, ?array $user): array
    {
        if (empty($input['student_id']) || empty($input['issues_discussed'])) {
            return $this->response(['message' => 'student_id and issues_discussed are required.'], 422);
        }

        $counsellorId = (int) ($input['counsellor_id'] ?? 3); // Sarah Atwine demo counsellor
        $stmt = $this->database->prepare("
            INSERT INTO counselling_sessions (student_id, incident_id, counsellor_id, session_date, issues_discussed, agreed_actions, follow_up_date, is_confidential)
            VALUES (:st_id, :inc_id, :counsellor_id, :date, :issues, :actions, :follow, TRUE)
            RETURNING session_id
        ");
        $stmt->execute([
            'st_id' => (int) $input['student_id'],
            'inc_id' => !empty($input['incident_id']) ? (int) $input['incident_id'] : null,
            'counsellor_id' => $counsellorId,
            'date' => $input['session_date'] ?? date('Y-m-d'),
            'issues' => trim($input['issues_discussed']),
            'actions' => $input['agreed_actions'] ?? 'Continuous pastoral mentorship.',
            'follow' => !empty($input['follow_up_date']) ? $input['follow_up_date'] : null,
        ]);
        $sessionId = (int) $stmt->fetchColumn();

        $this->auth->logAudit(
            $user['sub'] ?? null,
            'INSERT',
            'counselling_sessions',
            (string) $sessionId,
            "Logged counselling session for student #{$input['student_id']}"
        );

        return $this->response([
            'message' => 'Counselling session recorded.',
            'session_id' => $sessionId,
        ], 201);
    }

    private function getMerits(array $params): array
    {
        $sql = "
            SELECT m.merit_id, m.reason, m.merit_points, m.award_date,
                   s.student_id, s.first_name || ' ' || s.last_name as student_name, s.admission_no,
                   c.class_name,
                   st.first_name || ' ' || st.last_name as awarded_by_name
            FROM merits m
            JOIN students s ON m.student_id = s.student_id
            LEFT JOIN classes c ON s.class_id = c.class_id
            LEFT JOIN staff st ON m.awarded_by = st.staff_id
            ORDER BY m.award_date DESC
        ";
        return $this->database->query($sql)->fetchAll();
    }

    private function createMerit(array $input, ?array $user): array
    {
        if (empty($input['student_id']) || empty($input['reason'])) {
            return $this->response(['message' => 'student_id and reason are required.'], 422);
        }

        $termId = (int) ($input['term_id'] ?? $this->database->query("SELECT term_id FROM terms WHERE is_current = TRUE LIMIT 1")->fetchColumn() ?: 1);
        $awardedBy = (int) ($input['awarded_by'] ?? ($user['sub'] ?? 1));
        $staffId = (int) $this->database->query("SELECT linked_id FROM users WHERE user_id = $awardedBy")->fetchColumn() ?: 1;
        $points = (int) ($input['merit_points'] ?? 2);

        $stmt = $this->database->prepare("
            INSERT INTO merits (student_id, term_id, reason, merit_points, awarded_by, award_date)
            VALUES (:st_id, :term_id, :reason, :points, :awarded_by, :date)
            RETURNING merit_id
        ");
        $stmt->execute([
            'st_id' => (int) $input['student_id'],
            'term_id' => $termId,
            'reason' => trim($input['reason']),
            'points' => $points,
            'awarded_by' => $staffId,
            'date' => $input['award_date'] ?? date('Y-m-d'),
        ]);
        $meritId = (int) $stmt->fetchColumn();

        // Update behaviour summary
        $this->updateStudentBehaviourSummary((int) $input['student_id'], $termId, 0, 0, $points);

        $this->auth->logAudit(
            $user['sub'] ?? null,
            'INSERT',
            'merits',
            (string) $meritId,
            "Awarded $points merit points to student #{$input['student_id']}"
        );

        return $this->response([
            'message' => 'Merit commendation awarded.',
            'merit_id' => $meritId,
        ], 201);
    }

    private function updateStudentBehaviourSummary(int $studentId, int $termId, int $addIncidents, int $addDemerits, int $addMerits): void
    {
        $classId = (int) $this->database->query("SELECT class_id FROM students WHERE student_id = $studentId")->fetchColumn();

        $stmt = $this->database->prepare("
            INSERT INTO behaviour_summary (student_id, term_id, class_id, total_incidents, total_demerits, total_merits, conduct_grade, remarks)
            VALUES (:st_id, :term_id, :class_id, :inc, :demerits, :merits, 'Good', 'Active monitoring')
            ON CONFLICT (student_id, term_id) DO UPDATE SET
                total_incidents = behaviour_summary.total_incidents + EXCLUDED.total_incidents,
                total_demerits = behaviour_summary.total_demerits + EXCLUDED.total_demerits,
                total_merits = behaviour_summary.total_merits + EXCLUDED.total_merits,
                updated_at = CURRENT_TIMESTAMP
        ");
        $stmt->execute([
            'st_id' => $studentId,
            'term_id' => $termId,
            'class_id' => $classId ?: null,
            'inc' => $addIncidents,
            'demerits' => $addDemerits,
            'merits' => $addMerits,
        ]);

        // Auto calculate conduct grade
        $curr = $this->database->query(
            "SELECT total_demerits, total_merits FROM behaviour_summary WHERE student_id = $studentId AND term_id = $termId"
        )->fetch();

        if ($curr) {
            $dem = (int) $curr['total_demerits'];
            $mer = (int) $curr['total_merits'];
            $grade = 'Good';
            if ($dem === 0 && $mer >= 2) {
                $grade = 'Excellent';
            } elseif ($dem <= 3) {
                $grade = 'Good';
            } elseif ($dem <= 7) {
                $grade = 'Fair';
            } else {
                $grade = 'Poor';
            }

            $this->database->exec("UPDATE behaviour_summary SET conduct_grade = '$grade' WHERE student_id = $studentId AND term_id = $termId");
        }
    }

    private function getAuditLogs(): array
    {
        return $this->database->query("
            SELECT al.log_id, al.action, al.table_affected, al.record_id, al.details, al.action_time,
                   u.username, u.full_name, u.role
            FROM audit_log al
            LEFT JOIN users u ON al.user_id = u.user_id
            ORDER BY al.action_time DESC
            LIMIT 50
        ")->fetchAll();
    }

    private function tableNames(): array
    {
        $query = $this->database->query(
            "SELECT table_name FROM information_schema.tables
             WHERE table_schema = 'public' ORDER BY table_name"
        );

        return array_column($query->fetchAll(), 'table_name');
    }

    private function seedCounts(): array
    {
        $tables = ['terms', 'staff', 'classes', 'students', 'users', 'incidents', 'sanctions', 'audit_log'];
        $counts = [];
        foreach ($tables as $table) {
            $counts[$table] = (int) $this->database->query("SELECT COUNT(*) FROM \"$table\"")->fetchColumn();
        }

        return $counts;
    }

    private function response(array $body, int $status = 200): array
    {
        return ['status' => $status, 'body' => $body];
    }
}
