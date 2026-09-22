import { useEffect, useState } from 'react';
import { api } from './api/client';
import './styles.css';

function Login({ onLogin }) {
  const [username, setUsername] = useState('adong.grace');
  const [password, setPassword] = useState('Grace@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      onLogin(await api.login({ username, password }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return <main className="login-page"><form className="login-card" onSubmit={submit}>
    <div className="brand"><span className="brand-mark">S</span><strong>SDMS</strong></div>
    <div className="eyebrow">School conduct platform</div>
    <h1>Welcome back.</h1>
    <p className="login-copy">Sign in to review discipline activity and student wellbeing records.</p>
    <label className="field">Username<input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" /></label>
    <label className="field">Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" /></label>
    {error && <div className="error">{error}</div>}
    <button className="primary-button" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
    <div className="demo-hint">Demo account: <strong>adong.grace</strong> / <strong>Grace@123</strong></div>
  </form></main>;
}

function Dashboard({ session, onLogout }) {
  const [tables, setTables] = useState([]);
  const [counts, setCounts] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.tables(), api.seedStatus()]).then(([tableData, statusData]) => {
      setTables(tableData.tables);
      setCounts(statusData.counts);
    }).catch((requestError) => setError(requestError.message));
  }, []);

  const metrics = [
    ['Students', counts.students ?? '—'],
    ['Staff', counts.staff ?? '—'],
    ['Incidents', counts.incidents ?? '—'],
    ['Audit events', counts.audit_log ?? '—'],
  ];

  return <div className="shell">
    <aside className="sidebar"><div className="brand"><span className="brand-mark">S</span><strong>SDMS</strong></div><div className="nav-label">Workspace</div><div className="nav-item">Overview</div><div className="sidebar-note">Student Discipline Management System<br />Connected to PostgreSQL</div></aside>
    <main className="main"><header className="topbar"><div><div className="eyebrow">Tuesday, 22 September 2026</div><h1>Good morning, Grace.</h1></div><div className="user-chip">{session.user.full_name} · {session.user.role} <button className="logout" onClick={onLogout}>Log out</button></div></header>
      <section className="metrics">{metrics.map(([label, value]) => <div className="metric" key={label}><div className="metric-label">{label}</div><div className="metric-value">{value}</div></div>)}</section>
      {error && <div className="error">{error}</div>}
      <section className="content-grid"><div className="panel"><div className="panel-heading"><h2>Database tables</h2><span className="metric-label">{tables.length} connected</span></div><ul className="table-list">{tables.map((table) => <li key={table}>{table}</li>)}</ul></div><div className="panel"><div className="panel-heading"><h2>Seed snapshot</h2></div>{Object.entries(counts).map(([name, value]) => <div className="status-row" key={name}><span>{name.replaceAll('_', ' ')}</span><span className="status-number">{value}</span></div>)}</div></section>
    </main>
  </div>;
}

export default function App() {
  const [session, setSession] = useState(null);
  return session ? <Dashboard session={session} onLogout={() => setSession(null)} /> : <Login onLogin={setSession} />;
}
