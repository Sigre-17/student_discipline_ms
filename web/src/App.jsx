import { useEffect, useState } from 'react';
import { api, setAuthToken } from './api/client';
import './styles.css';

const DEMO_ACCOUNTS = [
  { username: 'adong.grace', name: 'Grace Adong', role: 'Head Teacher' },
  { username: 'okello.david', name: 'David Okello', role: 'Discipline Master' },
  { username: 'atwine.sarah', name: 'Sarah Atwine', role: 'Counsellor' },
  { username: 'mugisha.brian', name: 'Brian Mugisha', role: 'Class Teacher' },
  { username: 'admin', name: 'System Admin', role: 'Administrator' },
];

function formatTitle(text) {
  if (!text) return '';
  return text
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function Login({ onLogin }) {
  const [username, setUsername] = useState('adong.grace');
  const [password, setPassword] = useState('Grace@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    if (event) event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login({ username, password });
      onLogin(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  function pickAccount(acc) {
    setUsername(acc.username);
    setPassword('Grace@123');
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="brand">
          <span className="brand-mark">S</span>
          <strong>SDMS</strong>
        </div>
        <div className="eyebrow">School conduct platform</div>
        <h1>Staff Sign In</h1>
        <p className="login-copy">
          Access student discipline files, record conduct infractions, issue sanctions, and track counselling sessions.
        </p>

        <label className="field">
          Username
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            placeholder="e.g. adong.grace"
          />
        </label>
        <label className="field">
          Password
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete="current-password"
          />
        </label>

        {error && <div className="error">{error}</div>}

        <button className="primary-button" disabled={loading}>
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>

        <div className="demo-hint">
          <strong>Quick Login as Seeded Staff:</strong>
          <div className="demo-role-buttons">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                type="button"
                key={acc.username}
                className="demo-role-btn"
                onClick={() => pickAccount(acc)}
              >
                {acc.name} ({acc.role})
              </button>
            ))}
          </div>
        </div>
      </form>
    </main>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Core Data
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [sanctions, setSanctions] = useState([]);
  const [counselling, setCounselling] = useState([]);
  const [merits, setMerits] = useState([]);
  const [classes, setClasses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [rules, setRules] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [tables, setTables] = useState([]);
  const [counts, setCounts] = useState({});

  // Loading & Filter states
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [incidentSearch, setIncidentSearch] = useState('');
  const [incidentStatusFilter, setIncidentStatusFilter] = useState('');
  const [incidentSeverityFilter, setIncidentSeverityFilter] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState('');

  // Modals
  const [modalIncident, setModalIncident] = useState(false);
  const [modalSanction, setModalSanction] = useState(false);
  const [modalCounselling, setModalCounselling] = useState(false);
  const [modalMerit, setModalMerit] = useState(false);
  const [modalStudent, setModalStudent] = useState(false);
  const [selectedStudentProfile, setSelectedStudentProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Form states
  const [newIncident, setNewIncident] = useState({
    category_id: '',
    rule_id: '',
    student_id: '',
    role_in_incident: 'Offender',
    statement: '',
    location: 'School Grounds',
    description: '',
    incident_date: new Date().toISOString().split('T')[0],
  });

  const [newSanction, setNewSanction] = useState({
    incident_id: '',
    student_id: '',
    sanction_type: 'Written Warning',
    details: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    days_suspended: 7,
    conditions_for_return: 'Return accompanied by parent/guardian with written undertaking.',
  });

  const [newCounselling, setNewCounselling] = useState({
    student_id: '',
    incident_id: '',
    session_date: new Date().toISOString().split('T')[0],
    issues_discussed: '',
    agreed_actions: '',
    follow_up_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
  });

  const [newMerit, setNewMerit] = useState({
    student_id: '',
    reason: '',
    merit_points: 2,
    award_date: new Date().toISOString().split('T')[0],
  });

  const [newStudent, setNewStudent] = useState({
    admission_no: '',
    first_name: '',
    last_name: '',
    date_of_birth: '2012-05-10',
    gender: 'Male',
    school_level: 'Secondary',
    class_id: '',
  });

  function showFeedback(msg) {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 4500);
  }

  // Initial load when logged in
  useEffect(() => {
    if (!session) return;
    refreshAllData();
  }, [session]);

  async function refreshAllData() {
    setLoading(true);
    try {
      const [
        statsData,
        studentsData,
        incidentsData,
        sanctionsData,
        classesData,
        categoriesData,
        rulesData,
        tablesData,
        seedData,
      ] = await Promise.all([
        api.dashboardStats(),
        api.students(),
        api.incidents(),
        api.sanctions(),
        api.classes(),
        api.offenceCategories(),
        api.schoolRules(),
        api.tables(),
        api.seedStatus(),
      ]);

      setStats(statsData);
      setStudents(studentsData.students || []);
      setIncidents(incidentsData.incidents || []);
      setSanctions(sanctionsData.sanctions || []);
      setClasses(classesData.classes || []);
      setCategories(categoriesData.categories || []);
      setRules(rulesData.rules || []);
      setTables(tablesData.tables || []);
      setCounts(seedData.counts || {});

      // Load protected data if role permits
      const role = session.user.role;
      if (['Head Teacher', 'Deputy Head Teacher', 'Counsellor', 'Administrator'].includes(role)) {
        const cData = await api.counselling().catch(() => ({ sessions: [] }));
        setCounselling(cData.sessions || []);
      }
      const mData = await api.merits().catch(() => ({ merits: [] }));
      setMerits(mData.merits || []);

      const lData = await api.auditLogs().catch(() => ({ logs: [] }));
      setAuditLogs(lData.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Handle Logout
  function handleLogout() {
    setAuthToken('');
    setSession(null);
  }

  // Create Incident
  async function submitIncident(e) {
    e.preventDefault();
    if (!newIncident.category_id || !newIncident.description) {
      alert('Please select an offence category and enter an incident description.');
      return;
    }
    try {
      const payload = {
        category_id: parseInt(newIncident.category_id, 10),
        rule_id: newIncident.rule_id ? parseInt(newIncident.rule_id, 10) : null,
        description: newIncident.description,
        location: newIncident.location,
        incident_date: newIncident.incident_date,
        students: newIncident.student_id
          ? [
              {
                student_id: parseInt(newIncident.student_id, 10),
                role_in_incident: newIncident.role_in_incident,
                statement: newIncident.statement,
              },
            ]
          : [],
      };
      await api.createIncident(payload);
      setModalIncident(false);
      setNewIncident({
        category_id: '',
        rule_id: '',
        student_id: '',
        role_in_incident: 'Offender',
        statement: '',
        location: 'School Grounds',
        description: '',
        incident_date: new Date().toISOString().split('T')[0],
      });
      showFeedback('Incident recorded successfully!');
      refreshAllData();
    } catch (err) {
      alert(err.message);
    }
  }

  // Update Incident Status
  async function handleUpdateIncidentStatus(id, newStatus) {
    try {
      await api.updateIncidentStatus(id, newStatus);
      showFeedback(`Incident #${id} status changed to ${newStatus}.`);
      refreshAllData();
    } catch (err) {
      alert(err.message);
    }
  }

  // Create Sanction
  async function submitSanction(e) {
    e.preventDefault();
    if (!newSanction.incident_id || !newSanction.student_id) {
      alert('Please select an incident and student.');
      return;
    }
    try {
      await api.createSanction({
        incident_id: parseInt(newSanction.incident_id, 10),
        student_id: parseInt(newSanction.student_id, 10),
        sanction_type: newSanction.sanction_type,
        details: newSanction.details,
        start_date: newSanction.start_date,
        end_date: newSanction.end_date,
        days_suspended: parseInt(newSanction.days_suspended, 10) || 7,
        conditions_for_return: newSanction.conditions_for_return,
      });
      setModalSanction(false);
      showFeedback('Sanction issued successfully.');
      refreshAllData();
    } catch (err) {
      alert(err.message);
    }
  }

  // Update Sanction Status
  async function handleUpdateSanction(id, status) {
    try {
      await api.updateSanction(id, status);
      showFeedback(`Sanction marked as ${status}.`);
      refreshAllData();
    } catch (err) {
      alert(err.message);
    }
  }

  // Create Counselling Session
  async function submitCounselling(e) {
    e.preventDefault();
    if (!newCounselling.student_id || !newCounselling.issues_discussed) {
      alert('Please select a student and describe the issues discussed.');
      return;
    }
    try {
      await api.createCounselling({
        student_id: parseInt(newCounselling.student_id, 10),
        incident_id: newCounselling.incident_id ? parseInt(newCounselling.incident_id, 10) : null,
        session_date: newCounselling.session_date,
        issues_discussed: newCounselling.issues_discussed,
        agreed_actions: newCounselling.agreed_actions,
        follow_up_date: newCounselling.follow_up_date,
      });
      setModalCounselling(false);
      showFeedback('Counselling session logged.');
      refreshAllData();
    } catch (err) {
      alert(err.message);
    }
  }

  // Create Merit
  async function submitMerit(e) {
    e.preventDefault();
    if (!newMerit.student_id || !newMerit.reason) {
      alert('Please select a student and provide a reason for the commendation.');
      return;
    }
    try {
      await api.createMerit({
        student_id: parseInt(newMerit.student_id, 10),
        reason: newMerit.reason,
        merit_points: parseInt(newMerit.merit_points, 10),
        award_date: newMerit.award_date,
      });
      setModalMerit(false);
      showFeedback('Merit points awarded.');
      refreshAllData();
    } catch (err) {
      alert(err.message);
    }
  }

  // Create Student
  async function submitStudent(e) {
    e.preventDefault();
    if (!newStudent.admission_no || !newStudent.first_name || !newStudent.last_name) {
      alert('Please fill out admission number, first name, and last name.');
      return;
    }
    try {
      await api.createStudent({
        ...newStudent,
        class_id: newStudent.class_id ? parseInt(newStudent.class_id, 10) : null,
      });
      setModalStudent(false);
      showFeedback('Student enrolled successfully.');
      refreshAllData();
    } catch (err) {
      alert(err.message);
    }
  }

  // Open Student Profile
  async function openProfile(studentId) {
    setLoadingProfile(true);
    try {
      const data = await api.studentProfile(studentId);
      setSelectedStudentProfile(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingProfile(false);
    }
  }

  if (!session) {
    return <Login onLogin={setSession} />;
  }

  const todayFormatted = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = session?.user?.full_name ? session.user.full_name.split(' ')[0] : 'Staff';

  // Filtered Incidents
  const filteredIncidents = incidents.filter((inc) => {
    if (incidentStatusFilter && inc.status !== incidentStatusFilter) return false;
    if (incidentSeverityFilter && inc.severity_level !== incidentSeverityFilter) return false;
    if (incidentSearch) {
      const q = incidentSearch.toLowerCase();
      const matchDesc = inc.description?.toLowerCase().includes(q);
      const matchCat = inc.category_name?.toLowerCase().includes(q);
      const matchLoc = inc.location?.toLowerCase().includes(q);
      const matchStudents = inc.involved_students_summary?.toLowerCase().includes(q);
      if (!matchDesc && !matchCat && !matchLoc && !matchStudents) return false;
    }
    return true;
  });

  // Filtered Students
  const filteredStudents = students.filter((st) => {
    if (studentClassFilter && String(st.class_id) !== String(studentClassFilter)) return false;
    if (studentSearch) {
      const q = studentSearch.toLowerCase();
      const matchName = `${st.first_name} ${st.last_name}`.toLowerCase().includes(q);
      const matchAdm = st.admission_no?.toLowerCase().includes(q);
      if (!matchName && !matchAdm) return false;
    }
    return true;
  });

  return (
    <div className="shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">S</span>
          <strong>SDMS</strong>
        </div>

        <div className="nav-label">Navigation</div>
        <div
          className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span className="nav-icon">📊</span> Overview
        </div>
        <div
          className={`nav-item ${activeTab === 'incidents' ? 'active' : ''}`}
          onClick={() => setActiveTab('incidents')}
        >
          <span className="nav-icon">🚨</span> Incidents
        </div>
        <div
          className={`nav-item ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          <span className="nav-icon">👨‍🎓</span> Students & Conduct
        </div>
        <div
          className={`nav-item ${activeTab === 'sanctions' ? 'active' : ''}`}
          onClick={() => setActiveTab('sanctions')}
        >
          <span className="nav-icon">⚖️</span> Sanctions & Orders
        </div>
        <div
          className={`nav-item ${activeTab === 'counselling' ? 'active' : ''}`}
          onClick={() => setActiveTab('counselling')}
        >
          <span className="nav-icon">💬</span> Counselling
        </div>
        <div
          className={`nav-item ${activeTab === 'merits' ? 'active' : ''}`}
          onClick={() => setActiveTab('merits')}
        >
          <span className="nav-icon">🏆</span> Merits & Commendations
        </div>
        <div
          className={`nav-item ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          <span className="nav-icon">📜</span> School Rules
        </div>
        <div
          className={`nav-item ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          <span className="nav-icon">🛡️</span> Audit Logs
        </div>
        <div
          className={`nav-item ${activeTab === 'database' ? 'active' : ''}`}
          onClick={() => setActiveTab('database')}
        >
          <span className="nav-icon">🗄️</span> Database Schema
        </div>

        <div className="sidebar-note">
          <strong>Academic Term:</strong> {stats?.current_term?.term_name || 'Term 3'} (
          {stats?.current_term?.academic_year || '2026'})<br />
          PostgreSQL Database Connected
        </div>
      </aside>

      {/* Main Panel */}
      <main className="main">
        {/* Topbar */}
        <header className="topbar">
          <div>
            <div className="eyebrow">{todayFormatted}</div>
            <h1>
              {greeting}, {firstName}.
            </h1>
          </div>
          <div className="topbar-right">
            <button className="btn btn-primary" onClick={() => setModalIncident(true)}>
              + Report Incident
            </button>
            <div className="user-chip">
              <span>{session.user.full_name}</span>
              <span className="user-role-badge">{session.user.role}</span>
              <button className="logout" onClick={handleLogout}>
                Log out
              </button>
            </div>
          </div>
        </header>

        {feedback && <div className="success-msg">{feedback}</div>}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <section className="metrics">
              <div className="metric">
                <div className="metric-label">Enrolled Students</div>
                <div className="metric-value">{stats?.counts?.students ?? 0}</div>
                <div className="metric-sub">Across {classes.length} classes</div>
              </div>
              <div className="metric">
                <div className="metric-label">Active Incidents</div>
                <div className="metric-value">{stats?.counts?.open_incidents ?? 0}</div>
                <div className="metric-sub">{stats?.counts?.incidents ?? 0} total this term</div>
              </div>
              <div className="metric">
                <div className="metric-label">Active Sanctions</div>
                <div className="metric-value">{stats?.counts?.active_sanctions ?? 0}</div>
                <div className="metric-sub">{stats?.counts?.active_suspensions ?? 0} on suspension</div>
              </div>
              <div className="metric">
                <div className="metric-label">Counselling Sessions</div>
                <div className="metric-value">{stats?.counts?.counselling_sessions ?? 0}</div>
                <div className="metric-sub">{stats?.counts?.merits ?? 0} merits awarded</div>
              </div>
            </section>

            <div className="content-grid">
              {/* Recent Incidents Panel */}
              <div className="panel">
                <div className="panel-heading">
                  <h2>Recent Incidents</h2>
                  <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('incidents')}>
                    View All
                  </button>
                </div>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Category</th>
                        <th>Severity</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats?.recent_incidents?.map((inc) => (
                        <tr key={inc.incident_id}>
                          <td>{inc.incident_date}</td>
                          <td>
                            <strong>{inc.category_name}</strong>
                          </td>
                          <td>
                            <span className={`badge badge-${inc.severity_level?.toLowerCase()}`}>
                              {inc.severity_level}
                            </span>
                          </td>
                          <td>{inc.location}</td>
                          <td>
                            <span className="badge badge-reported">{inc.status}</span>
                          </td>
                          <td>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setIncidentSearch(inc.category_name);
                                setActiveTab('incidents');
                              }}
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Conduct & Severity Breakdown */}
              <div className="panel">
                <div className="panel-heading">
                  <h2>Conduct Health</h2>
                </div>
                <div style={{ marginBottom: 18 }}>
                  <div className="metric-label" style={{ marginBottom: 8 }}>
                    <strong>Conduct Grade Distribution</strong>
                  </div>
                  {stats?.conduct_grades &&
                    Object.entries(stats.conduct_grades).map(([grade, val]) => (
                      <div className="status-row" key={grade}>
                        <span className={`badge badge-${grade.toLowerCase()}`}>{grade}</span>
                        <span className="status-number">{val} students</span>
                      </div>
                    ))}
                </div>

                <div className="metric-label" style={{ marginBottom: 8 }}>
                  <strong>Infractions by Severity</strong>
                </div>
                {stats?.by_severity &&
                  Object.entries(stats.by_severity).map(([sev, val]) => (
                    <div className="status-row" key={sev}>
                      <span>{sev}</span>
                      <span className="status-number">{val}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INCIDENTS */}
        {activeTab === 'incidents' && (
          <div className="panel">
            <div className="panel-heading">
              <div>
                <h2>School Incidents Register</h2>
                <div className="metric-sub">Official log of all recorded rule infractions</div>
              </div>
              <button className="btn btn-primary" onClick={() => setModalIncident(true)}>
                + Record New Incident
              </button>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
              <input
                className="search-input"
                placeholder="Search incident, location, student..."
                value={incidentSearch}
                onChange={(e) => setIncidentSearch(e.target.value)}
              />
              <div className="filter-group">
                <select
                  className="select-input"
                  value={incidentStatusFilter}
                  onChange={(e) => setIncidentStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="Reported">Reported</option>
                  <option value="Under Investigation">Under Investigation</option>
                  <option value="Heard">Heard</option>
                  <option value="Closed">Closed</option>
                  <option value="Dismissed">Dismissed</option>
                </select>

                <select
                  className="select-input"
                  value={incidentSeverityFilter}
                  onChange={(e) => setIncidentSeverityFilter(e.target.value)}
                >
                  <option value="">All Severities</option>
                  <option value="Minor">Minor</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Serious">Serious</option>
                  <option value="Grave">Grave</option>
                </select>
              </div>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Date & Time</th>
                    <th>Offence / Category</th>
                    <th>Severity</th>
                    <th>Involved Students</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncidents.map((inc) => (
                    <tr key={inc.incident_id}>
                      <td>#{inc.incident_id}</td>
                      <td>
                        <strong>{inc.incident_date}</strong>
                        <div className="metric-sub">{inc.incident_time}</div>
                      </td>
                      <td>
                        <strong>{inc.category_name}</strong>
                        <div className="metric-sub">{inc.description}</div>
                      </td>
                      <td>
                        <span className={`badge badge-${inc.severity_level?.toLowerCase()}`}>
                          {inc.severity_level}
                        </span>
                      </td>
                      <td>
                        {inc.involved_students_summary ? (
                          <span>{inc.involved_students_summary}</span>
                        ) : (
                          <span style={{ color: '#8eafbe' }}>None recorded</span>
                        )}
                      </td>
                      <td>{inc.location}</td>
                      <td>
                        <span className={`badge badge-${inc.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                          {inc.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setNewSanction((prev) => ({
                                ...prev,
                                incident_id: inc.incident_id,
                              }));
                              setModalSanction(true);
                            }}
                          >
                            Sanction
                          </button>
                          <select
                            className="select-input btn-sm"
                            value={inc.status}
                            onChange={(e) => handleUpdateIncidentStatus(inc.incident_id, e.target.value)}
                          >
                            <option value="Reported">Reported</option>
                            <option value="Under Investigation">Investigate</option>
                            <option value="Heard">Hearing</option>
                            <option value="Closed">Close</option>
                            <option value="Dismissed">Dismiss</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredIncidents.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: 30, color: '#8eafbe' }}>
                        No incidents matching the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: STUDENTS */}
        {activeTab === 'students' && (
          <div className="panel">
            <div className="panel-heading">
              <div>
                <h2>Student Directory & Conduct Records</h2>
                <div className="metric-sub">Click any student to view their 360-degree conduct profile</div>
              </div>
              <button className="btn btn-primary" onClick={() => setModalStudent(true)}>
                + Enroll Student
              </button>
            </div>

            <div className="filter-bar">
              <input
                className="search-input"
                placeholder="Search by student name or admission number..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
              <select
                className="select-input"
                value={studentClassFilter}
                onChange={(e) => setStudentClassFilter(e.target.value)}
              >
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c.class_id} value={c.class_id}>
                    {c.class_name} {c.stream} ({c.school_level})
                  </option>
                ))}
              </select>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Admission No</th>
                    <th>Full Name</th>
                    <th>Class</th>
                    <th>Level</th>
                    <th>Gender</th>
                    <th>Demerits</th>
                    <th>Merits</th>
                    <th>Conduct Grade</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((st) => (
                    <tr key={st.student_id}>
                      <td>
                        <strong>{st.admission_no}</strong>
                      </td>
                      <td>
                        <strong>
                          {st.first_name} {st.last_name}
                        </strong>
                      </td>
                      <td>
                        {st.class_name ? `${st.class_name} ${st.stream || ''}` : 'Unassigned'}
                      </td>
                      <td>{st.school_level}</td>
                      <td>{st.gender}</td>
                      <td>
                        <span style={{ color: st.total_demerits > 5 ? '#c53030' : '#4a5568', fontWeight: 700 }}>
                          {st.total_demerits} pts
                        </span>
                      </td>
                      <td>
                        <span style={{ color: '#22543d', fontWeight: 700 }}>+{st.total_merits} pts</span>
                      </td>
                      <td>
                        <span className={`badge badge-${st.conduct_grade?.toLowerCase()}`}>
                          {st.conduct_grade}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => openProfile(st.student_id)}>
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: SANCTIONS */}
        {activeTab === 'sanctions' && (
          <div className="panel">
            <div className="panel-heading">
              <div>
                <h2>Sanctions & Disciplinary Orders</h2>
                <div className="metric-sub">Issued penalties, detentions, suspensions, and return conditions</div>
              </div>
              <button className="btn btn-primary" onClick={() => setModalSanction(true)}>
                + Issue Sanction
              </button>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Student</th>
                    <th>Sanction Type</th>
                    <th>Incident Offence</th>
                    <th>Dates / Duration</th>
                    <th>Issued By</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sanctions.map((sn) => (
                    <tr key={sn.sanction_id}>
                      <td>#{sn.sanction_id}</td>
                      <td>
                        <strong>{sn.student_name}</strong>
                        <div className="metric-sub">{sn.admission_no} · {sn.class_name}</div>
                      </td>
                      <td>
                        <strong>{sn.sanction_type}</strong>
                        <div className="metric-sub">{sn.details}</div>
                      </td>
                      <td>{sn.category_name}</td>
                      <td>
                        {sn.start_date} to {sn.end_date}
                        {sn.days_suspended && (
                          <div className="metric-sub" style={{ color: '#c53030', fontWeight: 600 }}>
                            {sn.days_suspended} days suspended
                          </div>
                        )}
                      </td>
                      <td>{sn.issued_by_name || 'Administration'}</td>
                      <td>
                        <span
                          className={`badge ${
                            sn.status === 'Completed'
                              ? 'badge-closed'
                              : sn.status === 'Ongoing'
                              ? 'badge-grave'
                              : 'badge-reported'
                          }`}
                        >
                          {sn.status}
                        </span>
                      </td>
                      <td>
                        {sn.status !== 'Completed' && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleUpdateSanction(sn.sanction_id, 'Completed')}
                          >
                            Mark Done
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {sanctions.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: 24, color: '#8eafbe' }}>
                        No sanctions recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: COUNSELLING */}
        {activeTab === 'counselling' && (
          <div className="panel">
            <div className="panel-heading">
              <div>
                <h2>Guidance & Counselling Sessions</h2>
                <div className="metric-sub">Confidential pastoral and behavioural intervention records</div>
              </div>
              {['Head Teacher', 'Deputy Head Teacher', 'Counsellor', 'Administrator'].includes(
                session.user.role
              ) && (
                <button className="btn btn-primary" onClick={() => setModalCounselling(true)}>
                  + Log Counselling Session
                </button>
              )}
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Student</th>
                    <th>Issues Discussed</th>
                    <th>Agreed Action Plan</th>
                    <th>Follow-up Date</th>
                    <th>Counsellor</th>
                  </tr>
                </thead>
                <tbody>
                  {counselling.map((cs) => (
                    <tr key={cs.session_id}>
                      <td>
                        <strong>{cs.session_date}</strong>
                      </td>
                      <td>
                        <strong>{cs.student_name}</strong>
                        <div className="metric-sub">{cs.admission_no} · {cs.class_name}</div>
                      </td>
                      <td>{cs.issues_discussed}</td>
                      <td>
                        <strong>{cs.agreed_actions}</strong>
                      </td>
                      <td>{cs.follow_up_date || 'N/A'}</td>
                      <td>{cs.counsellor_name}</td>
                    </tr>
                  ))}
                  {counselling.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: 24, color: '#8eafbe' }}>
                        No counselling sessions on file or restricted by role.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: MERITS */}
        {activeTab === 'merits' && (
          <div className="panel">
            <div className="panel-heading">
              <div>
                <h2>Merits & Commendations</h2>
                <div className="metric-sub">Positive reinforcement and exemplary conduct tracking</div>
              </div>
              <button className="btn btn-primary" onClick={() => setModalMerit(true)}>
                + Award Merit Commendation
              </button>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Award Date</th>
                    <th>Student</th>
                    <th>Commendation Reason</th>
                    <th>Points Awarded</th>
                    <th>Awarded By</th>
                  </tr>
                </thead>
                <tbody>
                  {merits.map((m) => (
                    <tr key={m.merit_id}>
                      <td>{m.award_date}</td>
                      <td>
                        <strong>{m.student_name}</strong>
                        <div className="metric-sub">{m.admission_no} · {m.class_name}</div>
                      </td>
                      <td>{m.reason}</td>
                      <td>
                        <span className="badge badge-excellent">+{m.merit_points} Merits</span>
                      </td>
                      <td>{m.awarded_by_name}</td>
                    </tr>
                  ))}
                  {merits.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: 24, color: '#8eafbe' }}>
                        No merits awarded yet this term.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: SCHOOL RULES */}
        {activeTab === 'rules' && (
          <div className="panel">
            <div className="panel-heading">
              <div>
                <h2>School Rules & Offence Classifications</h2>
                <div className="metric-sub">Official school penal code and sanction guidelines</div>
              </div>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Rule #</th>
                    <th>Offence Category</th>
                    <th>Severity Level</th>
                    <th>Rule Specification</th>
                    <th>Prescribed Sanctions</th>
                    <th>Applicable Level</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((r) => (
                    <tr key={r.rule_id}>
                      <td>Rule {r.rule_id}</td>
                      <td>
                        <strong>{r.category_name}</strong>
                      </td>
                      <td>
                        <span className={`badge badge-${r.severity_level?.toLowerCase()}`}>
                          {r.severity_level} ({r.demerit_points} pts)
                        </span>
                      </td>
                      <td>{r.rule_text}</td>
                      <td>{r.prescribed_sanction}</td>
                      <td>{r.applies_to_level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 8: AUDIT LOG */}
        {activeTab === 'audit' && (
          <div className="panel">
            <div className="panel-heading">
              <div>
                <h2>System Audit Trail</h2>
                <div className="metric-sub">Immutable, timestamped record of all administrative actions</div>
              </div>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Role</th>
                    <th>Action</th>
                    <th>Target Table</th>
                    <th>Record ID</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.log_id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{log.action_time}</td>
                      <td>
                        <strong>{log.full_name || log.username || 'System'}</strong>
                      </td>
                      <td>{log.role || 'System'}</td>
                      <td>
                        <span className="badge badge-reported">{log.action}</span>
                      </td>
                      <td>
                        <code>{log.table_affected}</code>
                      </td>
                      <td>{log.record_id || '—'}</td>
                      <td>{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 9: DATABASE SCHEMA */}
        {activeTab === 'database' && (
          <section className="content-grid">
            <div className="panel">
              <div className="panel-heading">
                <h2>Connected PostgreSQL Tables</h2>
                <span className="metric-label">{tables.length} tables verified</span>
              </div>
              <ul className="table-list">
                {tables.map((table) => (
                  <li key={table}>
                    <span>{formatTitle(table)}</span>
                    <span style={{ fontSize: 11, color: '#137752', fontWeight: 700 }}>● 3NF</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="panel">
              <div className="panel-heading">
                <h2>Seed Record Counts</h2>
              </div>
              {Object.entries(counts).map(([name, value]) => (
                <div className="status-row" key={name}>
                  <span>{formatTitle(name)}</span>
                  <span className="status-number">{value} rows</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* MODAL 1: REPORT INCIDENT */}
      {modalIncident && (
        <div className="modal-backdrop" onClick={() => setModalIncident(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Record Incident</h3>
              <button className="modal-close" onClick={() => setModalIncident(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={submitIncident}>
              <div className="modal-body">
                <div className="form-grid">
                  <label className="field">
                    Offence Category *
                    <select
                      value={newIncident.category_id}
                      onChange={(e) =>
                        setNewIncident({ ...newIncident, category_id: e.target.value, rule_id: '' })
                      }
                      required
                    >
                      <option value="">Select category...</option>
                      {categories.map((cat) => (
                        <option key={cat.category_id} value={cat.category_id}>
                          {cat.category_name} ({cat.severity_level} · {cat.demerit_points} pts)
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    Specific Rule Violated
                    <select
                      value={newIncident.rule_id}
                      onChange={(e) => setNewIncident({ ...newIncident, rule_id: e.target.value })}
                    >
                      <option value="">Select rule...</option>
                      {rules
                        .filter(
                          (r) =>
                            !newIncident.category_id ||
                            r.category_name ===
                              categories.find((c) => String(c.category_id) === String(newIncident.category_id))
                                ?.category_name
                        )
                        .map((r) => (
                          <option key={r.rule_id} value={r.rule_id}>
                            Rule #{r.rule_id}: {r.rule_text.substring(0, 45)}...
                          </option>
                        ))}
                    </select>
                  </label>

                  <label className="field">
                    Date of Incident *
                    <input
                      type="date"
                      value={newIncident.incident_date}
                      onChange={(e) => setNewIncident({ ...newIncident, incident_date: e.target.value })}
                      required
                    />
                  </label>

                  <label className="field">
                    Location *
                    <input
                      placeholder="e.g. Main Gate, Library, Lab"
                      value={newIncident.location}
                      onChange={(e) => setNewIncident({ ...newIncident, location: e.target.value })}
                      required
                    />
                  </label>

                  <label className="field form-grid-full">
                    Primary Involved Student
                    <select
                      value={newIncident.student_id}
                      onChange={(e) => setNewIncident({ ...newIncident, student_id: e.target.value })}
                    >
                      <option value="">Select student...</option>
                      {students.map((st) => (
                        <option key={st.student_id} value={st.student_id}>
                          {st.first_name} {st.last_name} ({st.admission_no} · {st.class_name})
                        </option>
                      ))}
                    </select>
                  </label>

                  {newIncident.student_id && (
                    <>
                      <label className="field">
                        Role in Incident
                        <select
                          value={newIncident.role_in_incident}
                          onChange={(e) =>
                            setNewIncident({ ...newIncident, role_in_incident: e.target.value })
                          }
                        >
                          <option value="Offender">Offender</option>
                          <option value="Victim">Victim</option>
                          <option value="Witness">Witness</option>
                          <option value="Accomplice">Accomplice</option>
                        </select>
                      </label>

                      <label className="field">
                        Initial Statement / Explanation
                        <input
                          placeholder="Student's response or explanation..."
                          value={newIncident.statement}
                          onChange={(e) => setNewIncident({ ...newIncident, statement: e.target.value })}
                        />
                      </label>
                    </>
                  )}

                  <label className="field form-grid-full">
                    Incident Description & Evidence *
                    <textarea
                      placeholder="Detailed factual statement of what transpired, witnesses present, and immediate actions taken..."
                      value={newIncident.description}
                      onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                      required
                    />
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalIncident(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save & Log Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ISSUE SANCTION */}
      {modalSanction && (
        <div className="modal-backdrop" onClick={() => setModalSanction(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Issue Disciplinary Sanction</h3>
              <button className="modal-close" onClick={() => setModalSanction(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={submitSanction}>
              <div className="modal-body">
                <div className="form-grid">
                  <label className="field form-grid-full">
                    Related Incident *
                    <select
                      value={newSanction.incident_id}
                      onChange={(e) => setNewSanction({ ...newSanction, incident_id: e.target.value })}
                      required
                    >
                      <option value="">Select incident...</option>
                      {incidents.map((inc) => (
                        <option key={inc.incident_id} value={inc.incident_id}>
                          #{inc.incident_id} - {inc.category_name} ({inc.incident_date})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field form-grid-full">
                    Student *
                    <select
                      value={newSanction.student_id}
                      onChange={(e) => setNewSanction({ ...newSanction, student_id: e.target.value })}
                      required
                    >
                      <option value="">Select student...</option>
                      {students.map((st) => (
                        <option key={st.student_id} value={st.student_id}>
                          {st.first_name} {st.last_name} ({st.admission_no} · {st.class_name})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    Sanction Type *
                    <select
                      value={newSanction.sanction_type}
                      onChange={(e) => setNewSanction({ ...newSanction, sanction_type: e.target.value })}
                      required
                    >
                      <option value="Verbal Warning">Verbal Warning</option>
                      <option value="Written Warning">Written Warning</option>
                      <option value="Detention">Detention</option>
                      <option value="Manual Work">Manual Work / Community Service</option>
                      <option value="Suspension">Suspension</option>
                      <option value="Parent Summons">Parent Summons</option>
                      <option value="Expulsion">Expulsion</option>
                    </select>
                  </label>

                  <label className="field">
                    Start Date
                    <input
                      type="date"
                      value={newSanction.start_date}
                      onChange={(e) => setNewSanction({ ...newSanction, start_date: e.target.value })}
                    />
                  </label>

                  {newSanction.sanction_type === 'Suspension' ? (
                    <>
                      <label className="field">
                        Days Suspended
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={newSanction.days_suspended}
                          onChange={(e) => setNewSanction({ ...newSanction, days_suspended: e.target.value })}
                        />
                      </label>
                      <label className="field form-grid-full">
                        Conditions for Return to School
                        <textarea
                          placeholder="e.g. Must be accompanied by parent/guardian, produce signed letter of remorse, complete counselling session..."
                          value={newSanction.conditions_for_return}
                          onChange={(e) =>
                            setNewSanction({ ...newSanction, conditions_for_return: e.target.value })
                          }
                        />
                      </label>
                    </>
                  ) : (
                    <label className="field">
                      Completion / End Date
                      <input
                        type="date"
                        value={newSanction.end_date}
                        onChange={(e) => setNewSanction({ ...newSanction, end_date: e.target.value })}
                      />
                    </label>
                  )}

                  <label className="field form-grid-full">
                    Sanction Details / Assigned Task
                    <textarea
                      placeholder="e.g. 2 hours library organization; compound cleanup; formal copy placed in permanent file..."
                      value={newSanction.details}
                      onChange={(e) => setNewSanction({ ...newSanction, details: e.target.value })}
                    />
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalSanction(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Issue Sanction Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: LOG COUNSELLING */}
      {modalCounselling && (
        <div className="modal-backdrop" onClick={() => setModalCounselling(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Log Pastoral Counselling Session</h3>
              <button className="modal-close" onClick={() => setModalCounselling(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={submitCounselling}>
              <div className="modal-body">
                <div className="form-grid">
                  <label className="field form-grid-full">
                    Student *
                    <select
                      value={newCounselling.student_id}
                      onChange={(e) => setNewCounselling({ ...newCounselling, student_id: e.target.value })}
                      required
                    >
                      <option value="">Select student...</option>
                      {students.map((st) => (
                        <option key={st.student_id} value={st.student_id}>
                          {st.first_name} {st.last_name} ({st.admission_no} · {st.class_name})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    Session Date *
                    <input
                      type="date"
                      value={newCounselling.session_date}
                      onChange={(e) => setNewCounselling({ ...newCounselling, session_date: e.target.value })}
                      required
                    />
                  </label>

                  <label className="field">
                    Follow-up Date
                    <input
                      type="date"
                      value={newCounselling.follow_up_date}
                      onChange={(e) => setNewCounselling({ ...newCounselling, follow_up_date: e.target.value })}
                    />
                  </label>

                  <label className="field form-grid-full">
                    Issues Discussed & Observations *
                    <textarea
                      placeholder="Root causes of behaviour, emotional triggers, home environment factors discussed..."
                      value={newCounselling.issues_discussed}
                      onChange={(e) =>
                        setNewCounselling({ ...newCounselling, issues_discussed: e.target.value })
                      }
                      required
                    />
                  </label>

                  <label className="field form-grid-full">
                    Agreed Action Plan & Commitments
                    <textarea
                      placeholder="Specific targets agreed with learner, peer accountability, monitoring schedule..."
                      value={newCounselling.agreed_actions}
                      onChange={(e) =>
                        setNewCounselling({ ...newCounselling, agreed_actions: e.target.value })
                      }
                    />
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalCounselling(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Confidential Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: AWARD MERIT */}
      {modalMerit && (
        <div className="modal-backdrop" onClick={() => setModalMerit(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Award Positive Merit Commendation</h3>
              <button className="modal-close" onClick={() => setModalMerit(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={submitMerit}>
              <div className="modal-body">
                <div className="form-grid">
                  <label className="field form-grid-full">
                    Student *
                    <select
                      value={newMerit.student_id}
                      onChange={(e) => setNewMerit({ ...newMerit, student_id: e.target.value })}
                      required
                    >
                      <option value="">Select student...</option>
                      {students.map((st) => (
                        <option key={st.student_id} value={st.student_id}>
                          {st.first_name} {st.last_name} ({st.admission_no} · {st.class_name})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    Merit Points *
                    <select
                      value={newMerit.merit_points}
                      onChange={(e) => setNewMerit({ ...newMerit, merit_points: e.target.value })}
                    >
                      <option value="1">+1 Point (Good deed / cooperation)</option>
                      <option value="2">+2 Points (Academic honesty / leadership)</option>
                      <option value="3">+3 Points (Exemplary integrity / service)</option>
                      <option value="5">+5 Points (Heroic conduct / school representation)</option>
                    </select>
                  </label>

                  <label className="field">
                    Award Date
                    <input
                      type="date"
                      value={newMerit.award_date}
                      onChange={(e) => setNewMerit({ ...newMerit, award_date: e.target.value })}
                    />
                  </label>

                  <label className="field form-grid-full">
                    Reason for Commendation *
                    <textarea
                      placeholder="e.g. Demonstrated exceptional honesty by returning lost property; assisted peer with special learning needs..."
                      value={newMerit.reason}
                      onChange={(e) => setNewMerit({ ...newMerit, reason: e.target.value })}
                      required
                    />
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalMerit(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Award Merits
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: ENROLL STUDENT */}
      {modalStudent && (
        <div className="modal-backdrop" onClick={() => setModalStudent(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Enroll Student into SDMS</h3>
              <button className="modal-close" onClick={() => setModalStudent(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={submitStudent}>
              <div className="modal-body">
                <div className="form-grid">
                  <label className="field">
                    Admission Number *
                    <input
                      placeholder="e.g. GUL/2026/015"
                      value={newStudent.admission_no}
                      onChange={(e) => setNewStudent({ ...newStudent, admission_no: e.target.value })}
                      required
                    />
                  </label>

                  <label className="field">
                    Gender *
                    <select
                      value={newStudent.gender}
                      onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value })}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </label>

                  <label className="field">
                    First Name *
                    <input
                      placeholder="First name"
                      value={newStudent.first_name}
                      onChange={(e) => setNewStudent({ ...newStudent, first_name: e.target.value })}
                      required
                    />
                  </label>

                  <label className="field">
                    Last Name *
                    <input
                      placeholder="Last name"
                      value={newStudent.last_name}
                      onChange={(e) => setNewStudent({ ...newStudent, last_name: e.target.value })}
                      required
                    />
                  </label>

                  <label className="field">
                    Date of Birth
                    <input
                      type="date"
                      value={newStudent.date_of_birth}
                      onChange={(e) => setNewStudent({ ...newStudent, date_of_birth: e.target.value })}
                    />
                  </label>

                  <label className="field">
                    School Level *
                    <select
                      value={newStudent.school_level}
                      onChange={(e) => setNewStudent({ ...newStudent, school_level: e.target.value })}
                    >
                      <option value="Secondary">Secondary</option>
                      <option value="Primary">Primary</option>
                      <option value="Nursery">Nursery</option>
                    </select>
                  </label>

                  <label className="field form-grid-full">
                    Class Assignment
                    <select
                      value={newStudent.class_id}
                      onChange={(e) => setNewStudent({ ...newStudent, class_id: e.target.value })}
                    >
                      <option value="">Select class...</option>
                      {classes.map((c) => (
                        <option key={c.class_id} value={c.class_id}>
                          {c.class_name} {c.stream} ({c.school_level})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalStudent(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Enroll Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: 360 DEGREE STUDENT CONDUCT PROFILE */}
      {selectedStudentProfile && (
        <div className="modal-backdrop" onClick={() => setSelectedStudentProfile(null)}>
          <div className="modal-card modal-card-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Student Conduct Dossier</h3>
              <button className="modal-close" onClick={() => setSelectedStudentProfile(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              {/* Profile Header */}
              <div className="profile-header">
                <div className="profile-avatar">
                  {selectedStudentProfile.student?.first_name?.charAt(0)}
                  {selectedStudentProfile.student?.last_name?.charAt(0)}
                </div>
                <div className="profile-meta">
                  <h4>
                    {selectedStudentProfile.student?.first_name}{' '}
                    {selectedStudentProfile.student?.last_name}
                  </h4>
                  <div className="profile-sub">
                    <strong>Admission No:</strong> {selectedStudentProfile.student?.admission_no} ·{' '}
                    <strong>Class:</strong> {selectedStudentProfile.student?.class_name}{' '}
                    {selectedStudentProfile.student?.stream} · <strong>Level:</strong>{' '}
                    {selectedStudentProfile.student?.school_level}
                  </div>
                </div>
                <div>
                  <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
                    🖨️ Print Conduct Sheet
                  </button>
                </div>
              </div>

              {/* Conduct Summaries */}
              <div style={{ marginBottom: 20 }}>
                <h4>Term Conduct Evaluation</h4>
                {selectedStudentProfile.summary?.map((sm) => (
                  <div className="status-row" key={sm.summary_id}>
                    <div>
                      <strong>
                        {sm.term_name} {sm.academic_year}
                      </strong>
                      <div className="metric-sub">{sm.remarks || 'Conduct under regular monitoring.'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge badge-${sm.conduct_grade?.toLowerCase()}`}>
                        Grade: {sm.conduct_grade}
                      </span>
                      <div className="metric-sub">
                        {sm.total_demerits} demerits · {sm.total_merits} merits
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Incidents History */}
              <div style={{ marginBottom: 20 }}>
                <h4>Incident History ({selectedStudentProfile.incidents?.length || 0})</h4>
                {selectedStudentProfile.incidents?.length > 0 ? (
                  <table className="data-table" style={{ marginTop: 8 }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Category</th>
                        <th>Role</th>
                        <th>Demerits</th>
                        <th>Statement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStudentProfile.incidents.map((inc) => (
                        <tr key={inc.incident_id}>
                          <td>{inc.incident_date}</td>
                          <td>
                            <strong>{inc.category_name}</strong>
                          </td>
                          <td>
                            <span className="badge badge-reported">{inc.role_in_incident}</span>
                          </td>
                          <td>{inc.demerit_points || 0} pts</td>
                          <td>{inc.statement || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="metric-sub">No infractions recorded on this student's file.</p>
                )}
              </div>

              {/* Sanctions & Suspensions */}
              <div style={{ marginBottom: 20 }}>
                <h4>Sanctions & Disciplinary Orders</h4>
                {selectedStudentProfile.sanctions?.length > 0 ? (
                  <table className="data-table" style={{ marginTop: 8 }}>
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Details</th>
                        <th>Period</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStudentProfile.sanctions.map((sn) => (
                        <tr key={sn.sanction_id}>
                          <td>
                            <strong>{sn.sanction_type}</strong>
                          </td>
                          <td>{sn.details}</td>
                          <td>
                            {sn.start_date} to {sn.end_date}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                sn.status === 'Completed' ? 'badge-closed' : 'badge-reported'
                              }`}
                            >
                              {sn.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="metric-sub">No disciplinary sanctions issued.</p>
                )}
              </div>

              {/* Merits */}
              <div style={{ marginBottom: 20 }}>
                <h4>Merits & Commendations</h4>
                {selectedStudentProfile.merits?.length > 0 ? (
                  <div style={{ marginTop: 8 }}>
                    {selectedStudentProfile.merits.map((m) => (
                      <div className="status-row" key={m.merit_id}>
                        <div>
                          <strong>{m.reason}</strong>
                          <div className="metric-sub">Awarded by {m.awarded_by_name} on {m.award_date}</div>
                        </div>
                        <span className="badge badge-excellent">+{m.merit_points} Pts</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="metric-sub">No merits recorded yet.</p>
                )}
              </div>

              {/* Counselling */}
              {selectedStudentProfile.counselling?.length > 0 && (
                <div>
                  <h4>Pastoral & Guidance Counselling (Confidential)</h4>
                  <div style={{ marginTop: 8 }}>
                    {selectedStudentProfile.counselling.map((cs) => (
                      <div className="status-row" key={cs.session_id}>
                        <div>
                          <strong>{cs.issues_discussed}</strong>
                          <div className="metric-sub">
                            Agreed: {cs.agreed_actions} · Counsellor: {cs.counsellor_name} ({cs.session_date})
                          </div>
                        </div>
                        <div>Follow-up: {cs.follow_up_date || 'None'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedStudentProfile(null)}
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
