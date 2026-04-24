import { useState } from 'react';
import { getAllFaculty, updateFacultyStatus, deleteFaculty } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const statusBadge = (s) => {
  const map = { Active: '#22c55e', 'On Leave': '#f59e0b', Retired: '#8b96b0' };
  return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '.72rem', fontWeight: 600, background: `${map[s]}22`, color: map[s] }}>{s}</span>;
};

export default function SearchFaculty() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('');
  const [subject, setSubject] = useState('');
  const [status, setStatus] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await getAllFaculty({ search: query, department, subject, status });
      setResults(res.data.data);
      setSearched(true);
    } catch { toast.error('Search failed'); }
    finally { setLoading(false); }
  };

  const handleStatus = async (id, newStatus) => {
    await updateFacultyStatus(id, newStatus);
    setResults(prev => prev.map(f => f._id === id ? { ...f, status: newStatus } : f));
    toast.success(`Status → ${newStatus}`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this faculty?')) return;
    await deleteFaculty(id);
    setResults(prev => prev.filter(f => f._id !== id));
    toast.success('Deleted');
  };

  const clear = () => { setQuery(''); setDepartment(''); setSubject(''); setStatus(''); setResults([]); setSearched(false); };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Search <span>Faculty</span></h1>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <form onSubmit={handleSearch}>
          <div className="form-group">
            <label>Keyword Search</label>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name, department, or subject..." autoFocus />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Department</label>
              <input value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. CSE" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Subject</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Data Structures" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option>Active</option><option>On Leave</option><option>Retired</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>🔍 {loading ? 'Searching...' : 'Search'}</button>
            <button type="button" className="btn btn-secondary" onClick={clear}>Clear</button>
          </div>
        </form>
      </div>

      {searched && (
        <>
          <div style={{ fontSize: '.85rem', color: 'var(--text2)', marginBottom: 14 }}>
            Found <strong>{results.length}</strong> result{results.length !== 1 ? 's' : ''}
            {query && <> for "<strong>{query}</strong>"</>}
          </div>

          {results.length === 0 ? (
            <div className="empty-state">
              <h3>No matching faculty found</h3>
              <p>Try different search terms or broaden your filters.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {results.map(f => (
                <div key={f._id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {f.profilePhoto ? (
                    <img src={`http://127.0.0.1:5000/uploads/${f.profilePhoto}`} alt={f.name}
                      style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(79,142,247,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', color: 'var(--accent)', flexShrink: 0 }}>
                      {f.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '.95rem' }}>{f.name}</div>
                    <div style={{ fontSize: '.78rem', color: 'var(--text2)' }}>{f.designation || 'Faculty'} · {f.department}</div>
                    {f.subjectsTaught?.length > 0 && (
                      <div style={{ marginTop: 4 }}>
                        {f.subjectsTaught.map(s => <span key={s} className="tag">{s}</span>)}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    {statusBadge(f.status)}
                    <div style={{ fontSize: '.78rem', color: 'var(--text3)' }}>
                      {f.qualification && <span>{f.qualification}</span>}
                      {f.experience ? <span> · {f.experience} yrs</span> : null}
                    </div>
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/faculty/${f._id}`)}>✏ Edit</button>
                        <select style={{ padding: '4px 7px', fontSize: '.72rem', borderRadius: 6 }}
                          value={f.status} onChange={e => handleStatus(f._id, e.target.value)}>
                          <option>Active</option><option>On Leave</option><option>Retired</option>
                        </select>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(f._id)}>🗑</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!searched && !loading && (
        <div className="empty-state">
          <h3>Enter search terms above</h3>
          <p>Search by faculty name, department, or subject taught.</p>
        </div>
      )}
    </div>
  );
}