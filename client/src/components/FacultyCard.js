import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const statusColors = { Active: '#22c55e', 'On Leave': '#f59e0b', Retired: '#8b96b0' };

export default function FacultyCard({ faculty: f, onDelete, onStatusChange }) {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const ini = f.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';

  return (
    <div className="card" style={{ transition: 'all .2s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        {f.profilePhoto ? (
          <img src={`http://127.0.0.1:5000/uploads/${f.profilePhoto}`} alt={f.name}
            style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(79,142,247,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent)', flexShrink: 0 }}>
            {ini}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700 }}>{f.name}</div>
          <div style={{ fontSize: '.75rem', color: 'var(--text2)' }}>{f.designation || 'Faculty'}</div>
          <span style={{ display: 'inline-block', marginTop: 4, padding: '2px 8px', borderRadius: 20, fontSize: '.68rem', fontWeight: 600, background: `${statusColors[f.status]}22`, color: statusColors[f.status] }}>
            ● {f.status}
          </span>
        </div>
      </div>

      <div style={{ fontSize: '.78rem', color: 'var(--text2)', marginBottom: 10, lineHeight: 1.8 }}>
        <div>🏛 {f.department}</div>
        {f.qualification && <div>🎓 {f.qualification}{f.experience ? ` · ${f.experience} yrs exp` : ''}</div>}
        {f.email && <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>✉ {f.email}</div>}
      </div>

      {f.subjectsTaught?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
          {f.subjectsTaught.slice(0, 3).map(s => <span key={s} className="tag">{s}</span>)}
          {f.subjectsTaught.length > 3 && <span className="tag">+{f.subjectsTaught.length - 3} more</span>}
        </div>
      )}

      {isAdmin && (
        <div style={{ display: 'flex', gap: 6, paddingTop: 10, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/faculty/${f._id}`)}>✏ Edit</button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/faculty/${f._id}/photo`)}>📷 Photo</button>
          <select style={{ padding: '4px 7px', fontSize: '.72rem', borderRadius: 6, flex: 1 }}
            value={f.status} onChange={e => onStatusChange && onStatusChange(f._id, e.target.value)}>
            <option>Active</option><option>On Leave</option><option>Retired</option>
          </select>
          <button className="btn btn-danger btn-sm" onClick={() => onDelete && onDelete(f._id)}>🗑</button>
        </div>
      )}
    </div>
  );
}