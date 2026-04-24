import { useEffect, useState } from 'react';
import { getAllFaculty, deleteFaculty, updateFacultyStatus } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const statusBadge = (s) => {
  const map = { Active: '#22c55e', 'On Leave': '#f59e0b', Retired: '#8b96b0' };
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '.72rem', fontWeight: 600, background: `${map[s]}22`, color: map[s] }}>
      {s}
    </span>
  );
};

const initials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';

export default function FacultyDirectory() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ department: '', subject: '', status: '' });
  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid');

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await getAllFaculty({ ...filters, search });
      setFaculty(res.data.data);
    } catch { toast.error('Failed to load faculty'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleSearch = (e) => { e.preventDefault(); fetch(); };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this faculty profile permanently?')) return;
    try { await deleteFaculty(id); toast.success('Faculty deleted'); fetch(); }
    catch { toast.error('Delete failed'); }
  };

  const handleStatus = async (id, status) => {
    try { await updateFacultyStatus(id, status); toast.success(`Status → ${status}`); fetch(); }
    catch { toast.error('Failed to update status'); }
  };

  const sf = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Faculty <span>Directory</span></h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn ${view === 'grid' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('grid')}>⊞ Grid</button>
          <button className={`btn ${view === 'table' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('table')}>☰ Table</button>
          {isAdmin && <button className="btn btn-primary" onClick={() => navigate('/faculty/new')}>+ Add Faculty</button>}
        </div>
      </div>

      {/* Search & Filters */}
      <form onSubmit={handleSearch}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 10, marginBottom: 20 }}>
          <input placeholder="Search by name, department, subject..." value={search} onChange={e => setSearch(e.target.value)} />
          <input placeholder="Department..." value={filters.department} onChange={e => sf('department', e.target.value)} />
          <input placeholder="Subject..." value={filters.subject} onChange={e => sf('subject', e.target.value)} />
          <select value={filters.status} onChange={e => sf('status', e.target.value)}>
            <option value="">All Statuses</option>
            <option>Active</option><option>On Leave</option><option>Retired</option>
          </select>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn btn-primary">🔍 Search</button>
            <button type="button" className="btn btn-secondary" onClick={() => { setFilters({ department: '', subject: '', status: '' }); setSearch(''); setTimeout(fetch, 0); }}>Clear</button>
          </div>
        </div>
      </form>

      <div style={{ fontSize: '.82rem', color: 'var(--text2)', marginBottom: 14 }}>{faculty.length} faculty member{faculty.length !== 1 ? 's' : ''} found</div>

      {loading ? (
        <div className="loading">Loading faculty...</div>
      ) : faculty.length === 0 ? (
        <div className="empty-state">
          <h3>No faculty found</h3>
          <p>Try different search filters or add a new faculty member.</p>
          {isAdmin && <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => navigate('/faculty/new')}>+ Add Faculty</button>}
        </div>
      ) : view === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {faculty.map(f => (
            <div key={f._id} className="card" style={{ cursor: 'pointer', transition: 'all .2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                {f.profilePhoto ? (
                  <img src={`http://127.0.0.1:5000/uploads/${f.profilePhoto}`} alt={f.name}
                    style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
                ) : (
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(79,142,247,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent)', flexShrink: 0 }}>
                    {initials(f.name)}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.95rem' }}>{f.name}</div>
                  <div style={{ fontSize: '.75rem', color: 'var(--text2)' }}>{f.designation || 'Faculty'}</div>
                  <div style={{ marginTop: 4 }}>{statusBadge(f.status)}</div>
                </div>
              </div>
              <div style={{ fontSize: '.8rem', color: 'var(--text2)', marginBottom: 8 }}>
                <div>🏛 {f.department}</div>
                {f.email && <div>✉ {f.email}</div>}
                {f.phone && <div>📞 {f.phone}</div>}
                {f.qualification && <div>🎓 {f.qualification}</div>}
                {f.experience > 0 && <div>⏱ Experience: {f.experience} yr{f.experience !== 1 ? 's' : ''}</div>}
              </div>
              {f.subjectsTaught?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                  {f.subjectsTaught.slice(0, 3).map(s => (
                    <span key={s} className="tag">{s}</span>
                  ))}
                  {f.subjectsTaught.length > 3 && <span className="tag">+{f.subjectsTaught.length - 3}</span>}
                </div>
              )}
              {isAdmin && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/faculty/${f._id}`)}>✏ Edit</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/faculty/${f._id}/photo`)}>📷 Photo</button>
                  <select style={{ padding: '4px 7px', fontSize: '.72rem', borderRadius: 6, flex: 1 }}
                    value={f.status} onChange={e => handleStatus(f._id, e.target.value)}>
                    <option>Active</option><option>On Leave</option><option>Retired</option>
                  </select>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(f._id)}>🗑</button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Faculty', 'Department', 'Subjects', 'Qualification', 'Exp', 'Status', isAdmin ? 'Actions' : ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: '.7rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {faculty.map(f => (
                <tr key={f._id} style={{ borderBottom: '1px solid var(--surface2)' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {f.profilePhoto ? (
                        <img src={`http://127.0.0.1:5000/uploads/${f.profilePhoto}`} alt={f.name}
                          style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(79,142,247,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.7rem', fontWeight: 700, color: 'var(--accent)' }}>
                          {initials(f.name)}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600 }}>{f.name}</div>
                        <div style={{ fontSize: '.7rem', color: 'var(--text3)' }}>{f.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>{f.department}</td>
                  <td style={{ padding: '10px 12px' }}>{f.subjectsTaught?.slice(0, 2).map(s => <span key={s} className="tag">{s}</span>)}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>{f.qualification || '—'}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>
                    {f.experience ? `Experience: ${f.experience} yr${f.experience !== 1 ? 's' : ''}` : '—'}
                  </td>
                  <td style={{ padding: '10px 12px' }}>{statusBadge(f.status)}</td>
                  {isAdmin && (
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/faculty/${f._id}`)}>✏</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/faculty/${f._id}/photo`)}>📷</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(f._id)}>🗑</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}