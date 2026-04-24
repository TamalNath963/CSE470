import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import toast from 'react-hot-toast';

const Stars = ({ rating }) => (
  <span>{[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= Math.round(rating) ? '#f59e0b' : '#2a3347', fontSize: 13 }}>★</span>)}</span>
);

const gradeColor = { Excellent: '#22c55e', Good: '#4f8ef7', Satisfactory: '#f59e0b', 'Needs Improvement': '#ef4444' };

const StatCard = ({ icon, label, value, color = 'var(--accent)', bg = 'rgba(79,142,247,.12)' }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ background: bg, fontSize: '1.3rem' }}>{icon}</div>
    <div>
      <div className="stat-val" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  </div>
);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');

  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activity, setActivity] = useState([]);
  const [actLoading, setActLoading] = useState(false);
  const [topFaculty, setTopFaculty] = useState([]);

  useEffect(() => { loadOverview(); }, []);

  const loadOverview = async () => {
    setStatsLoading(true);
    try {
      const [statsRes, reportsRes, topRes] = await Promise.all([
        API.get('/admin/stats'),
        API.get('/reports/summary'),
        API.get('/reports/top-faculty'),
      ]);
      setStats(statsRes.data.data);
      setReports(reportsRes.data.data || []);
      setTopFaculty(topRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setStatsLoading(false);
    }
  };

  const loadActivity = async () => {
    setActLoading(true);
    try {
      const res = await API.get('/admin/activity');
      setActivity(res.data.data || []);
    } catch {
      toast.error('Failed to load activity');
    } finally {
      setActLoading(false);
    }
  };

  const handleTabChange = (t) => {
    setTab(t);
    if (t === 'activity' && activity.length === 0) loadActivity();
  };

  const ini = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';

  const TABS = [
    { id: 'overview', label: '🏠 Overview' },
    { id: 'top', label: '🏆 Top Faculty' },
    { id: 'activity', label: '📋 Activity Log' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Admin <span>Dashboard</span></h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/reviews')}>🛡 Manage Reviews</button>
          <button className="btn btn-primary" onClick={() => navigate('/faculty/new')}>+ Add Faculty</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => handleTabChange(t.id)} style={{
            padding: '10px 20px', background: 'none', border: 'none',
            borderBottom: `2px solid ${tab === t.id ? 'var(--accent)' : 'transparent'}`,
            color: tab === t.id ? 'var(--accent)' : 'var(--text2)',
            fontWeight: tab === t.id ? 700 : 400,
            cursor: 'pointer', fontSize: '.88rem', fontFamily: 'inherit', transition: 'all .15s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {tab === 'overview' && (
        statsLoading ? <div className="loading">Loading dashboard...</div> : (
          <>
            <div className="stats-row" style={{ marginBottom: 24 }}>
              <StatCard icon="👥" label="Total Faculty" value={stats?.totalFaculty ?? 0} />
              <StatCard icon="✅" label="Active Faculty" value={stats?.activeFaculty ?? 0} color="var(--success)" bg="rgba(34,197,94,.12)" />
              <StatCard icon="⭐" label="Approved Reviews" value={stats?.approvedReviews ?? 0} color="var(--warning)" bg="rgba(245,158,11,.12)" />
              <StatCard icon="🔔" label="Pending Reviews" value={stats?.pendingReviews ?? 0} color="var(--danger)" bg="rgba(239,68,68,.12)" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
              {[
                ['📊 Avg Rating', stats?.avgRating ? `${stats.avgRating}/5` : '—'],
                ['📝 Total Reviews', stats?.totalReviews ?? 0],
                ['🏛 Departments', stats?.deptStats?.length ?? 0],
              ].map(([l, v]) => (
                <div key={l} className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)', marginBottom: 4 }}>{v}</div>
                  <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>{l}</div>
                </div>
              ))}
            </div>

            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>Faculty Performance Reports</div>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/reports')}>View All →</button>
              </div>
              {reports.length === 0 ? (
                <div style={{ color: 'var(--text3)', fontSize: '.85rem', textAlign: 'center', padding: '20px 0' }}>
                  No reports yet. Approve student reviews to generate reports.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {reports.map(r => (
                    <div key={r.facultyId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--surface2)', borderRadius: 10, cursor: 'pointer' }}
                      onClick={() => navigate('/reports')}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface3)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--surface2)'}>
                      {r.profilePhoto ? (
                        <img src={`http://127.0.0.1:5000/uploads/${r.profilePhoto}`} alt={r.facultyName}
                          style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(79,142,247,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '.82rem', color: 'var(--accent)', flexShrink: 0 }}>
                          {ini(r.facultyName)}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '.88rem' }}>{r.facultyName}</div>
                        <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{r.designation || 'Faculty'} · {r.department}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>{r.avgRating}</div>
                          <Stars rating={r.avgRating} />
                        </div>
                        <div style={{ fontSize: '.72rem', color: 'var(--text3)', textAlign: 'center' }}>
                          <div>{r.totalReviews} reviews</div>
                        </div>
                        {r.grade && (
                          <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: '.68rem', fontWeight: 700, background: `${gradeColor[r.grade]}20`, color: gradeColor[r.grade] }}>
                            {r.grade}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {stats?.deptStats?.length > 0 && (
              <div className="card">
                <div style={{ fontWeight: 700, marginBottom: 14 }}>Faculty by Department</div>
                {stats.deptStats.map(d => (
                  <div key={d._id} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem', marginBottom: 4 }}>
                      <span>{d._id || 'Unknown'}</span>
                      <span style={{ color: 'var(--text2)' }}>{d.count} faculty</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 3 }}>
                      <div style={{ width: `${(d.count / (stats.totalFaculty || 1)) * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent2))', borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {stats?.pendingReviews > 0 && (
              <div style={{ marginTop: 16, padding: '14px 18px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--danger)', marginBottom: 2 }}>🔔 {stats.pendingReviews} Review{stats.pendingReviews !== 1 ? 's' : ''} Awaiting Approval</div>
                  <div style={{ fontSize: '.8rem', color: 'var(--text2)' }}>Student reviews need your approval before they appear publicly.</div>
                </div>
                <button className="btn btn-danger" onClick={() => navigate('/admin/reviews')}>Review Now →</button>
              </div>
            )}
          </>
        )
      )}

      {/* ── TOP FACULTY TAB ── */}
      {tab === 'top' && (
        topFaculty.length === 0
          ? <div className="empty-state"><h3>No ratings yet</h3><p>Top faculty appear once reviews are approved.</p></div>
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topFaculty.map((f, i) => (
                <div key={f.facultyId} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0, background: i===0?'rgba(245,158,11,.2)':i===1?'rgba(139,150,176,.2)':i===2?'rgba(176,124,90,.2)':'var(--surface2)', color: i===0?'#f59e0b':i===1?'#8b96b0':i===2?'#c97d4e':'var(--text3)' }}>
                    {i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}
                  </div>
                  {f.profilePhoto ? (
                    <img src={`http://127.0.0.1:5000/uploads/${f.profilePhoto}`} alt={f.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(79,142,247,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>{ini(f.name)}</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{f.name}</div>
                    <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>{f.designation||'Faculty'} · {f.department}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>{f.avgRating}</div>
                    <Stars rating={f.avgRating} />
                    <div style={{ fontSize: '.68rem', color: 'var(--text3)', marginTop: 2 }}>{f.totalReviews} review{f.totalReviews!==1?'s':''}</div>
                  </div>
                </div>
              ))}
            </div>
          )
      )}

      {/* ── ACTIVITY LOG TAB ── */}
      {tab === 'activity' && (
        actLoading ? <div className="loading">Loading activity...</div>
        : activity.length === 0
          ? <div className="empty-state"><h3>No activity yet</h3><p>System activity will appear here as faculty, reviews, and courses are created.</p></div>
          : (
            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: 16 }}>Recent System Activity</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {activity.map((a, i) => {
                  const typeConfig = {
                    Review:  { icon: '✍', color: '#4f8ef7', bg: 'rgba(79,142,247,.12)' },
                    Faculty: { icon: '👤', color: '#22c55e', bg: 'rgba(34,197,94,.12)' },
                    Course:  { icon: '📚', color: '#f59e0b', bg: 'rgba(245,158,11,.12)' },
                  };
                  const cfg = typeConfig[a.type] || { icon: '📌', color: 'var(--text2)', bg: 'var(--surface2)' };
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: i < activity.length-1 ? '1px solid var(--surface2)' : 'none' }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>{cfg.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '.85rem', fontWeight: 500 }}>{a.action}</div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                          <span style={{ padding: '1px 8px', borderRadius: 20, fontSize: '.65rem', fontWeight: 600, background: cfg.bg, color: cfg.color }}>{a.type}</span>
                          {a.status && (
                            <span style={{ fontSize: '.7rem', color: a.status==='Approved'||a.status==='Active'?'var(--success)':a.status==='Pending'?'var(--warning)':'var(--text3)' }}>● {a.status}</span>
                          )}
                        </div>
                      </div>
                      <div style={{ fontSize: '.72rem', color: 'var(--text3)', flexShrink: 0, textAlign: 'right' }}>
                        {a.time ? new Date(a.time).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '—'}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button className="btn btn-secondary" style={{ marginTop: 14, width: '100%', justifyContent: 'center' }} onClick={loadActivity}>🔄 Refresh Activity</button>
            </div>
          )
      )}
    </div>
  );
}