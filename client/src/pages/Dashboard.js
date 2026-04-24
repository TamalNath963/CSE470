import { useEffect, useState } from 'react';
import { getAllFaculty, getAllReviewsAdmin } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const [faculty, setFaculty] = useState([]);
  const [reviews, setReviews] = useState([]);
  const navigate = useNavigate();
  const { user, isAdmin, isFaculty } = useAuth();

  useEffect(() => {
    getAllFaculty().then(r => setFaculty(r.data.data)).catch(() => {});
    getAllReviewsAdmin().then(r => setReviews(r.data.data)).catch(() => {});
  }, []);

  const active = faculty.filter(f => f.status === 'Active').length;
  const onLeave = faculty.filter(f => f.status === 'On Leave').length;
  const retired = faculty.filter(f => f.status === 'Retired').length;
  const approvedReviews = reviews.filter(r => r.status === 'Approved').length;
  const pendingReviews = reviews.filter(r => r.status === 'Pending').length;

  const deptMap = {};
  faculty.forEach(f => { deptMap[f.department] = (deptMap[f.department] || 0) + 1; });
  const topDepts = Object.entries(deptMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Find this faculty member's own profile
  const myProfile = faculty.find(f => f.email === user?.email);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Faculty <span>Dashboard</span></h1>

        <div style={{ display: 'flex', gap: 8 }}>
          {/* Admin buttons */}
          {isAdmin && (
            <>
              <button className="btn btn-secondary" onClick={() => navigate('/reviews/submit')}>
                ✍ Submit Review
              </button>
              <button className="btn btn-primary" onClick={() => navigate('/faculty/new')}>
                + Add Faculty
              </button>
            </>
          )}

          {/* Faculty buttons */}
          {isFaculty && (
            <>
              {myProfile ? (
                <button className="btn btn-primary" onClick={() => navigate(`/faculty/${myProfile._id}`)}>
                  ✏️ Update My Profile
                </button>
              ) : (
                <button className="btn btn-primary" onClick={() => navigate('/faculty/create-my-profile')}>
                  👤 Create My Profile
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => navigate('/faculty')}>
                👥 View Directory
              </button>
            </>
          )}

          {/* Student buttons */}
          {!isAdmin && !isFaculty && (
            <>
              <button className="btn btn-secondary" onClick={() => navigate('/faculty')}>
                👥 View Faculty
              </button>
              <button className="btn btn-primary" onClick={() => navigate('/reviews/submit')}>
                ✍ Submit Review
              </button>
            </>
          )}
        </div>
      </div>

      {/* Welcome banner for faculty */}
      {isFaculty && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(79,142,247,.15), rgba(124,90,240,.15))',
          border: '1px solid rgba(79,142,247,.3)',
          borderRadius: 12, padding: '16px 20px', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>
              Welcome, {user?.name}! 👋
            </div>
            <div style={{ fontSize: '.83rem', color: 'var(--text2)' }}>
              {myProfile
                ? `Your profile is set up. Department: ${myProfile.department}`
                : 'Your faculty profile is not created yet. Click "Create My Profile" to get started.'}
            </div>
          </div>
          {!myProfile && (
            <button className="btn btn-primary" onClick={() => navigate('/faculty/create-my-profile')}>
              Create Profile →
            </button>
          )}
          {myProfile && (
            <button className="btn btn-secondary" onClick={() => navigate(`/faculty/${myProfile._id}`)}>
              Edit Profile →
            </button>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(79,142,247,.15)' }}>👥</div>
          <div><div className="stat-val">{faculty.length}</div><div className="stat-label">Total Faculty</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34,197,94,.15)' }}>✅</div>
          <div><div className="stat-val" style={{ color: 'var(--success)' }}>{active}</div><div className="stat-label">Active</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,.15)' }}>⭐</div>
          <div><div className="stat-val" style={{ color: 'var(--warning)' }}>{approvedReviews}</div><div className="stat-label">Approved Reviews</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,.15)' }}>🔔</div>
          <div><div className="stat-val" style={{ color: 'var(--danger)' }}>{pendingReviews}</div><div className="stat-label">Pending Reviews</div></div>
        </div>
      </div>

      <div className="grid2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 14 }}>Departments Overview</div>
          {topDepts.length === 0
            ? <div style={{ color: 'var(--text3)', fontSize: '.85rem' }}>No data yet</div>
            : topDepts.map(([d, c]) => (
              <div key={d} style={{ marginBottom: 11 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem', marginBottom: 4 }}>
                  <span>{d}</span><span style={{ color: 'var(--text2)' }}>{c} faculty</span>
                </div>
                <div style={{ height: 5, background: 'var(--surface2)', borderRadius: 3 }}>
                  <div style={{ width: `${(c / faculty.length) * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent2))', borderRadius: 3 }} />
                </div>
              </div>
            ))}
        </div>

        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 14 }}>Faculty Status</div>
          {[['🟢 Active', active, 'var(--success)'], ['🟡 On Leave', onLeave, 'var(--warning)'], ['⚪ Retired', retired, 'var(--text2)']].map(([l, c, col]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--surface2)', fontSize: '.85rem' }}>
              <span>{l}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 80, height: 5, background: 'var(--surface2)', borderRadius: 3 }}>
                  <div style={{ width: faculty.length ? `${(c / faculty.length) * 100}%` : '0%', height: '100%', background: col, borderRadius: 3 }} />
                </div>
                <span style={{ fontWeight: 700, color: col, minWidth: 20 }}>{c}</span>
              </div>
            </div>
          ))}
          <button className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: 14, justifyContent: 'center' }}
            onClick={() => navigate('/faculty')}>View All Faculty →</button>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 14 }}>Recent Faculty Added</div>
          {faculty.length === 0
            ? <div style={{ color: 'var(--text3)', fontSize: '.85rem' }}>No faculty added yet</div>
            : faculty.slice(-5).reverse().map(f => (
              <div key={f._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--surface2)', cursor: 'pointer' }}
                onClick={() => isAdmin && navigate(`/faculty/${f._id}`)}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(79,142,247,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.78rem', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                  {f.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '.82rem', fontWeight: 600 }}>{f.name}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{f.department}</div>
                </div>
                <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '.68rem', fontWeight: 600, background: f.status === 'Active' ? 'rgba(34,197,94,.15)' : f.status === 'On Leave' ? 'rgba(245,158,11,.15)' : 'rgba(139,150,176,.15)', color: f.status === 'Active' ? 'var(--success)' : f.status === 'On Leave' ? 'var(--warning)' : 'var(--text2)' }}>
                  {f.status}
                </span>
              </div>
            ))}
        </div>

        {/* <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 14 }}>Recent Approved Reviews</div>
          {reviews.filter(r => r.status === 'Approved').length === 0
            ? <div style={{ color: 'var(--text3)', fontSize: '.85rem' }}>No approved reviews yet</div>
            : reviews.filter(r => r.status === 'Approved').slice(-5).reverse().map(r => (
              <div key={r._id} style={{ padding: '7px 0', borderBottom: '1px solid var(--surface2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: '.8rem', fontWeight: 600 }}>{r.faculty?.name || '—'}</span>
                  <span style={{ color: '#f59e0b', fontSize: '.8rem' }}>{'★'.repeat(r.rating)}</span>
                </div>
                <div style={{ fontSize: '.72rem', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reviewText}</div>
              </div>
            ))}
          {isAdmin && pendingReviews > 0 && (
            <button className="btn btn-danger btn-sm" style={{ width: '100%', marginTop: 10, justifyContent: 'center' }}
              onClick={() => navigate('/admin/reviews')}>
              🔔 {pendingReviews} pending review{pendingReviews !== 1 ? 's' : ''} →
            </button>
          )}
        </div> */}
      </div>
    </div>
  );
}