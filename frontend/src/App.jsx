import { useEffect, useMemo, useState } from 'react';
import api from './api';

const emptyStudent = { studentId: '', name: '', email: '', department: '', semester: '', contact: '' };
const labels = { studentId: 'Student ID', name: 'Full Name', email: 'Email Address', department: 'Department', semester: 'Semester', contact: 'Contact Number' };
const sorters = {
  newest: (a, b) => String(b.createdAt || b._id).localeCompare(String(a.createdAt || a._id)),
  name: (a, b) => String(a.name).localeCompare(String(b.name)),
  id: (a, b) => String(a.studentId).localeCompare(String(b.studentId), undefined, { numeric: true }),
  semester: (a, b) => Number(a.semester) - Number(b.semester),
};

const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('') || '?';
const hue = (text = '') => [...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

const readTheme = () => {
  try { const saved = localStorage.getItem('sims-theme'); if (saved) return saved; } catch { /* ignore */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export default function App() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(emptyStudent);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('all');
  const [sort, setSort] = useState('newest');
  const [view, setView] = useState('table');
  const [theme, setTheme] = useState(readTheme);
  const [notice, setNotice] = useState({ text: '', error: false });
  const [loading, setLoading] = useState(true);

  const notify = (text, error = false) => setNotice({ text, error });
  const errorMessage = (error, fallback) => {
    if (error.response?.data?.message || error.response?.data?.error) return error.response.data.message || error.response.data.error;
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') return import.meta.env.DEV
      ? 'Cannot reach the local API. Start the backend and check its port and CORS settings.'
      : 'Cannot reach the API. The server may be waking up, try again in a few seconds.';
    return error.message || fallback;
  };

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('sims-theme', theme); } catch { /* ignore */ }
  }, [theme]);

  useEffect(() => {
    if (!notice.text) return undefined;
    const t = setTimeout(() => setNotice({ text: '', error: false }), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/students');
      const records = Array.isArray(data) ? data : data.students || data.data || [];
      setStudents(Array.isArray(records) ? records : []);
    } catch (e) { notify(errorMessage(e, 'Could not reach the backend.'), true); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadStudents(); }, []);

  const departments = useMemo(() => [...new Set(students.map((s) => s.department).filter(Boolean))].sort(), [students]);

  const stats = useMemo(() => {
    const counts = {};
    students.forEach((s) => { counts[s.department] = (counts[s.department] || 0) + 1; });
    const breakdown = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const avg = students.length ? (students.reduce((sum, s) => sum + Number(s.semester || 0), 0) / students.length).toFixed(1) : '0';
    const newest = [...students].sort(sorters.newest)[0];
    return { breakdown, avg, newest, max: breakdown[0]?.[1] || 1 };
  }, [students]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students
      .filter((s) => (dept === 'all' || s.department === dept)
        && (!q || `${s.studentId} ${s.name} ${s.email} ${s.department}`.toLowerCase().includes(q)))
      .sort(sorters[sort]);
  }, [students, search, dept, sort]);

  const openNew = () => { setForm(emptyStudent); setEditingId(null); setFormOpen(true); };
  const closeForm = () => { setForm(emptyStudent); setEditingId(null); setFormOpen(false); };

  const submit = async (event) => {
    event.preventDefault();
    try {
      const { data } = editingId ? await api.put(`/students/${editingId}`, form) : await api.post('/students', form);
      notify(data.message || 'Student saved successfully.');
      closeForm();
      await loadStudents();
    } catch (e) { notify(errorMessage(e, 'Unable to save student.'), true); }
  };

  const edit = (s) => {
    setEditingId(s._id);
    setForm({ studentId: s.studentId, name: s.name, email: s.email, department: s.department, semester: s.semester, contact: s.contact });
    setFormOpen(true);
  };

  const remove = async (id, name) => {
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    try { const { data } = await api.delete(`/students/${id}`); notify(data.message || 'Student deleted successfully.'); await loadStudents(); }
    catch (e) { notify(errorMessage(e, 'Unable to delete student.'), true); }
  };

  const exportCsv = () => {
    if (!visible.length) { notify('Nothing to export for the current filters.', true); return; }
    const cols = Object.keys(labels);
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [cols.map((c) => esc(labels[c])).join(','), ...visible.map((s) => cols.map((c) => esc(s[c])).join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url; a.download = `students-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    notify(`Exported ${visible.length} student${visible.length === 1 ? '' : 's'} to CSV.`);
  };

  return (
    <>
      <header className="topbar">
        <div className="brand"><span className="logo">B</span><div><strong>BIT Campus</strong><small>Student Information System</small></div></div>
        <div className="top-actions">
          <button className="ghost" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">{theme === 'dark' ? '☀ Light' : '☾ Dark'}</button>
          <button className="primary" onClick={openNew}>+ Add student</button>
        </div>
      </header>

      <main>
        <section className="hero">
          <p className="eyebrow">Overview</p>
          <h1>Your campus, <em>at a glance.</em></h1>
          <p>Track enrolment, spot trends across departments, and keep every record tidy in one place.</p>
        </section>

        {notice.text && <div className={`toast ${notice.error ? 'error' : ''}`} role="status">{notice.text}<button onClick={() => setNotice({ text: '', error: false })}>×</button></div>}

        <section className="stats">
          <div className="stat"><span>Total students</span><b>{students.length}</b></div>
          <div className="stat"><span>Departments</span><b>{departments.length}</b></div>
          <div className="stat"><span>Average semester</span><b>{stats.avg}</b></div>
          <div className="stat"><span>Latest addition</span><b className="small">{stats.newest?.name || '—'}</b></div>
        </section>

        {stats.breakdown.length > 0 && (
          <section className="panel">
            <div className="panel-head"><h2>Students by department</h2><span className="hint">Click a bar to filter</span></div>
            <div className="bars">
              {stats.breakdown.map(([name, count]) => (
                <button key={name} className={`bar-row ${dept === name ? 'active' : ''}`} onClick={() => setDept(dept === name ? 'all' : name)}>
                  <span className="bar-label">{name}</span>
                  <span className="bar-track"><span className="bar-fill" style={{ width: `${(count / stats.max) * 100}%` }} /></span>
                  <span className="bar-count">{count}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="panel">
          <div className="toolbar">
            <input className="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, ID, email or department…" />
            <select value={dept} onChange={(e) => setDept(e.target.value)}>
              <option value="all">All departments</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">Newest first</option>
              <option value="name">Name A–Z</option>
              <option value="id">Student ID</option>
              <option value="semester">Semester</option>
            </select>
            <div className="seg">
              <button className={view === 'table' ? 'on' : ''} onClick={() => setView('table')}>Table</button>
              <button className={view === 'cards' ? 'on' : ''} onClick={() => setView('cards')}>Cards</button>
            </div>
            <button className="ghost" onClick={exportCsv}>⭳ Export CSV</button>
          </div>
          <p className="count">Showing {visible.length} of {students.length}</p>

          {loading ? <p className="empty">Loading students…</p> : !visible.length ? <p className="empty">No students match your filters.</p> : view === 'table' ? (
            <div className="table-wrap">
              <table>
                <thead><tr>{['Student', 'ID', 'Department', 'Sem', 'Contact', ''].map((h) => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {visible.map((s) => (
                    <tr key={s._id}>
                      <td><div className="person"><span className="avatar" style={{ '--h': hue(s.name) }}>{initials(s.name)}</span><div><strong>{s.name}</strong><small>{s.email}</small></div></div></td>
                      <td>{s.studentId}</td>
                      <td>{s.department}</td>
                      <td><span className="pill">{s.semester}</span></td>
                      <td>{s.contact}</td>
                      <td className="row-actions"><button onClick={() => edit(s)}>Edit</button><button className="danger" onClick={() => remove(s._id, s.name)}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid">
              {visible.map((s) => (
                <article className="student-card" key={s._id}>
                  <div className="person"><span className="avatar lg" style={{ '--h': hue(s.name) }}>{initials(s.name)}</span><div><strong>{s.name}</strong><small>{s.studentId}</small></div></div>
                  <dl>
                    <div><dt>Department</dt><dd>{s.department}</dd></div>
                    <div><dt>Semester</dt><dd>{s.semester}</dd></div>
                    <div><dt>Email</dt><dd>{s.email}</dd></div>
                    <div><dt>Contact</dt><dd>{s.contact}</dd></div>
                  </dl>
                  <div className="card-actions"><button onClick={() => edit(s)}>Edit</button><button className="danger" onClick={() => remove(s._id, s.name)}>Delete</button></div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {formOpen && (
        <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) closeForm(); }}>
          <form className="modal" onSubmit={submit}>
            <div className="panel-head">
              <div><p className="eyebrow">{editingId ? 'Update record' : 'New record'}</p><h2>{editingId ? 'Edit student' : 'Add a student'}</h2></div>
              <button type="button" className="ghost" onClick={closeForm}>Close</button>
            </div>
            <div className="fields">
              {Object.keys(labels).map((key) => (
                <label key={key}>{labels[key]}
                  <input required type={key === 'email' ? 'email' : key === 'semester' ? 'number' : 'text'} min={key === 'semester' ? 1 : undefined} max={key === 'semester' ? 12 : undefined}
                    value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={`Enter ${labels[key].toLowerCase()}`} />
                </label>
              ))}
            </div>
            <div className="modal-foot"><button type="button" className="ghost" onClick={closeForm}>Cancel</button><button className="primary" type="submit">{editingId ? 'Save changes' : 'Add student'}</button></div>
          </form>
        </div>
      )}
    </>
  );
}
