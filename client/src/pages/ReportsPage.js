import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllFaculty } from '../utils/api';
import API from '../utils/api';
import toast from 'react-hot-toast';

const gradeColor = { Excellent: '#22c55e', Good: '#4f8ef7', Satisfactory: '#f59e0b', 'Needs Improvement': '#ef4444' };
const gradeBg   = { Excellent: 'rgba(34,197,94,.12)', Good: 'rgba(79,142,247,.12)', Satisfactory: 'rgba(245,158,11,.12)', 'Needs Improvement': 'rgba(239,68,68,.12)' };

const Stars = ({ rating, size = 14 }) => (
  <span style={{ letterSpacing: 1 }}>
    {[1,2,3,4,5].map(i => (
      <span key={i} style={{ color: i <= Math.round(rating) ? '#f59e0b' : '#2a3347', fontSize: size }}>★</span>
    ))}
  </span>
);

const Bar = ({ label, value, max = 5 }) => {
  if (!value) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', marginBottom: 4 }}>
        <span style={{ color: 'var(--text2)' }}>{label}</span>
        <span style={{ fontWeight: 700 }}>{value}/5</span>
      </div>
      <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 3 }}>
        <div style={{ width: `${(value / max) * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent2))', borderRadius: 3, transition: 'width .5s' }} />
      </div>
    </div>
  );
};

// ── Export PDF ────────────────────────────────────────────────────────────────
function exportPDF(reports) {
  const rows = reports.map((r, i) => `
    <tr style="background:${i%2===0?'#f8f9ff':'white'}">
      <td>${r.facultyName||''}</td>
      <td>${r.department||''}</td>
      <td>${r.designation||''}</td>
      <td style="text-align:center;font-weight:700;color:#f59e0b">${r.avgRating||''}</td>
      <td style="text-align:center">${r.grade||''}</td>
      <td style="text-align:center">${r.avgTeaching||'—'}</td>
      <td style="text-align:center">${r.avgKnowledge||'—'}</td>
      <td style="text-align:center">${r.avgCommunication||'—'}</td>
      <td style="text-align:center">${r.avgAvailability||'—'}</td>
      <td style="text-align:center">${r.totalReviews||0}</td>
    </tr>`).join('');

  const html = `<html><head><title>Faculty Performance Reports</title>
    <style>
      body{font-family:Arial,sans-serif;padding:28px;color:#1a1a2e}
      h1{color:#4f8ef7;font-size:22px;margin-bottom:4px}
      .sub{color:#666;font-size:12px;margin-bottom:20px}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th{background:#4f8ef7;color:white;padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.5px}
      td{padding:8px 10px;border-bottom:1px solid #eee}
      .footer{margin-top:24px;font-size:11px;color:#aaa;border-top:1px solid #eee;padding-top:10px}
    </style></head>
    <body>
      <h1>Faculty Performance Reports</h1>
      <div class="sub">Generated on ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})} · ${reports.length} faculty</div>
      <table>
        <thead><tr>
          <th>Faculty</th><th>Department</th><th>Designation</th>
          <th>Avg Rating</th><th>Grade</th><th>Teaching</th>
          <th>Knowledge</th><th>Communication</th><th>Availability</th><th>Reviews</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="footer">FacultyHub Evaluation System · Auto-generated from approved student reviews</div>
    </body></html>`;
  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.print();
}

// ── Export CSV ────────────────────────────────────────────────────────────────
function exportCSV(reports) {
  const rows = [
    ['Faculty Name','Department','Designation','Avg Rating','Grade','Teaching','Knowledge','Communication','Availability','Total Reviews'],
    ...reports.map(r => [
      r.facultyName||'', r.department||'', r.designation||'',
      r.avgRating||'', r.grade||'',
      r.avgTeaching||'', r.avgKnowledge||'',
      r.avgCommunication||'', r.avgAvailability||'',
      r.totalReviews||0,
    ])
  ];
  const csv = rows.map(row => row.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `faculty_reports_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success('Exported as CSV/Excel!');
}

// ── Export single detail PDF ──────────────────────────────────────────────────
function exportDetailPDF(data) {
  const f = data.faculty;
  const s = data.stats;
  if (!s) { toast.error('No stats to export'); return; }
  const html = `<html><head><title>Performance Report — ${f?.name}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:32px;color:#1a1a2e}
      h1{color:#4f8ef7;font-size:22px;margin-bottom:4px}
      .sub{color:#666;font-size:12px;margin-bottom:24px}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}
      .box{background:#f8f9ff;border-radius:8px;padding:14px;text-align:center}
      .box .val{font-size:26px;font-weight:800;color:#4f8ef7}.box .lbl{font-size:11px;color:#888;margin-top:4px}
      .section h3{font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:10px}
      .bar-row{margin-bottom:10px}.bar-label{display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px}
      .bar-bg{height:7px;background:#eee;border-radius:4px}.bar-fill{height:7px;background:#4f8ef7;border-radius:4px}
      .sem-grid{display:flex;gap:10px;flex-wrap:wrap}
      .sem-box{background:#f0f4ff;border-radius:8px;padding:10px 14px;text-align:center;min-width:100px}
      .footer{margin-top:32px;font-size:11px;color:#aaa;border-top:1px solid #eee;padding-top:12px}
    </style></head>
    <body>
      <h1>Faculty Performance Report</h1>
      <div class="sub">Generated on ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</div>
      <div class="grid">
        <div class="box"><div class="val" style="font-size:18px">${f?.name||'—'}</div><div class="lbl">Name</div></div>
        <div class="box"><div class="val" style="font-size:15px">${f?.department||'—'}</div><div class="lbl">Department</div></div>
        <div class="box"><div class="val" style="font-size:15px">${f?.designation||'—'}</div><div class="lbl">Designation</div></div>
        <div class="box"><div class="val" style="color:#f59e0b">${s.avgRating}</div><div class="lbl">Overall Rating / 5</div></div>
      </div>
      <div class="section"><h3>Detailed Ratings</h3>
        ${[['Teaching Quality',s.avgTeaching],['Subject Knowledge',s.avgKnowledge],['Communication',s.avgCommunication],['Availability',s.avgAvailability]]
          .filter(([,v])=>v).map(([l,v])=>`<div class="bar-row">
            <div class="bar-label"><span>${l}</span><span>${v}/5</span></div>
            <div class="bar-bg"><div class="bar-fill" style="width:${(v/5)*100}%"></div></div>
          </div>`).join('')}
      </div>
      ${data.semesterComparison?.length ? `<div class="section"><h3>Semester Comparison</h3>
        <div class="sem-grid">${data.semesterComparison.map(s=>`<div class="sem-box">
          <div style="font-size:11px;color:#888;margin-bottom:4px">${s.semester}</div>
          <div style="font-size:22px;font-weight:800;color:#f59e0b">${s.avgRating}</div>
          <div style="font-size:10px;color:#aaa">${s.count} reviews</div>
        </div>`).join('')}</div></div>` : ''}
      <div class="footer">Total reviews: ${s.totalReviews} · FacultyHub Evaluation System</div>
    </body></html>`;
  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.print();
}

export default function ReportsPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('reports');
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filterFaculty, setFilterFaculty] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [topFaculty, setTopFaculty] = useState([]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterFaculty) params.facultyId = filterFaculty;
      if (filterSemester) params.semester = filterSemester;
      const res = await API.get('/reports/summary', { params });
      setReports(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchTopFaculty = async () => {
    try {
      const res = await API.get('/reports/top-faculty');
      setTopFaculty(res.data.data || []);
    } catch {}
  };

  useEffect(() => {
    getAllFaculty().then(r => setFacultyList(r?.data?.data || [])).catch(() => {});
    fetchReports();
    fetchTopFaculty();
  }, []);

  const openDetail = async (facultyId) => {
    setDetailLoading(true);
    setTab('detail');
    try {
      const params = {};
      if (filterSemester) params.semester = filterSemester;
      const res = await API.get(`/reports/faculty/${facultyId}`, { params });
      setSelectedFaculty(res.data.data);
    } catch {
      toast.error('Failed to load faculty report');
      setTab('reports');
    } finally {
      setDetailLoading(false);
    }
  };

  const ini = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Performance <span>Reports</span></h1>
        {/* Export buttons — only shown when reports exist */}
        {reports.length > 0 && tab !== 'detail' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => exportPDF(reports)}>
              🖨 Print / PDF
            </button>
            <button className="btn btn-secondary" onClick={() => exportCSV(reports)}>
              📥 Export Excel
            </button>
          </div>
        )}
        {tab === 'detail' && selectedFaculty?.stats && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => exportDetailPDF(selectedFaculty)}>
              🖨 Print / PDF
            </button>
            <button className="btn btn-secondary" onClick={() => exportCSV([{
              facultyName: selectedFaculty.faculty?.name,
              department: selectedFaculty.faculty?.department,
              designation: selectedFaculty.faculty?.designation,
              avgRating: selectedFaculty.stats?.avgRating,
              grade: selectedFaculty.stats?.grade,
              avgTeaching: selectedFaculty.stats?.avgTeaching,
              avgKnowledge: selectedFaculty.stats?.avgKnowledge,
              avgCommunication: selectedFaculty.stats?.avgCommunication,
              avgAvailability: selectedFaculty.stats?.avgAvailability,
              totalReviews: selectedFaculty.stats?.totalReviews,
            }])}>
              📥 Export Excel
            </button>
          </div>
        )}
        {!reports.length && tab !== 'detail' && (
          <div style={{ fontSize: '.82rem', color: 'var(--text2)' }}>
            Auto-generated from approved student reviews
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        {[
          ['reports', '📋 Reports'],
          ['charts', '📊 Charts'],
          ['semester', '📅 Semester Comparison'],
          ['top', '🏆 Top Faculty'],
          ...(selectedFaculty ? [['detail', `📄 ${selectedFaculty.faculty?.name || 'Detail'}`]] : []),
        ].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: '10px 18px', background: 'none', border: 'none',
            borderBottom: `2px solid ${tab === id ? 'var(--accent)' : 'transparent'}`,
            color: tab === id ? 'var(--accent)' : 'var(--text2)',
            fontWeight: tab === id ? 700 : 400, cursor: 'pointer',
            fontSize: '.85rem', fontFamily: 'inherit', transition: 'all .15s', whiteSpace: 'nowrap',
          }}>{label}</button>
        ))}
      </div>

      {/* Filters */}
      {(tab === 'reports' || tab === 'charts' || tab === 'semester') && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
          <select value={filterFaculty} onChange={e => setFilterFaculty(e.target.value)} style={{ maxWidth: 220 }}>
            <option value="">All Faculty</option>
            {facultyList.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
          </select>
          <input value={filterSemester} onChange={e => setFilterSemester(e.target.value)}
            placeholder="Filter by semester (e.g. Spring 2025)" style={{ maxWidth: 240 }} />
          <button className="btn btn-primary" onClick={fetchReports}>🔍 Filter</button>
          <button className="btn btn-secondary" onClick={() => { setFilterFaculty(''); setFilterSemester(''); setTimeout(fetchReports, 0); }}>Clear</button>
        </div>
      )}

      {/* REPORTS TAB */}
      {tab === 'reports' && (
        loading ? <div className="loading">Loading reports...</div>
        : reports.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>📋</div>
            <h3>No reports yet</h3>
            <p>Reports are auto-generated once faculty receive approved reviews.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {reports.map(r => (
              <div key={r.facultyId} className="card" style={{ cursor: 'pointer', transition: 'all .2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                onClick={() => openDetail(r.facultyId)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {r.profilePhoto ? (
                      <img src={`http://127.0.0.1:5000/uploads/${r.profilePhoto}`} alt={r.facultyName}
                        style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(79,142,247,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                        {ini(r.facultyName)}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '.95rem' }}>{r.facultyName}</div>
                      <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>{r.designation || 'Faculty'} · {r.department}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>{r.avgRating}</div>
                    <Stars rating={r.avgRating} size={12} />
                  </div>
                </div>

                {r.grade && (
                  <div style={{ marginBottom: 10 }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '.72rem', fontWeight: 700, background: gradeBg[r.grade], color: gradeColor[r.grade] }}>
                      🏅 {r.grade}
                    </span>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                  {[
                    ['Teaching', r.avgTeaching],
                    ['Knowledge', r.avgKnowledge],
                    ['Communication', r.avgCommunication],
                    ['Availability', r.avgAvailability],
                  ].filter(([, v]) => v).map(([label, val]) => (
                    <div key={label} style={{ background: 'var(--surface2)', borderRadius: 7, padding: '7px 10px' }}>
                      <div style={{ fontSize: '.64rem', color: 'var(--text3)', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontWeight: 700, fontSize: '.88rem' }}>{val} <span style={{ color: '#f59e0b', fontSize: '.8rem' }}>★</span></div>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: '.75rem', color: 'var(--text3)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                  <span>{r.totalReviews} review{r.totalReviews !== 1 ? 's' : ''}</span>
                  <span style={{ color: 'var(--accent)' }}>View details →</span>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* CHARTS TAB */}
      {tab === 'charts' && (
        loading ? <div className="loading">Loading...</div>
        : reports.length === 0 ? <div className="empty-state"><h3>No data yet</h3><p>Approve some reviews to see charts.</p></div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: 18 }}>Average Rating by Faculty</div>
              {reports.map(r => (
                <div key={r.facultyId} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem', marginBottom: 5 }}>
                    <span style={{ fontWeight: 600 }}>{r.facultyName} <span style={{ color: 'var(--text3)', fontWeight: 400 }}>({r.department})</span></span>
                    <span style={{ fontWeight: 700, color: '#f59e0b' }}>{r.avgRating}/5</span>
                  </div>
                  <div style={{ height: 10, background: 'var(--surface2)', borderRadius: 5 }}>
                    <div style={{ width: `${(r.avgRating / 5) * 100}%`, height: '100%', background: `linear-gradient(90deg, ${gradeColor[r.grade] || 'var(--accent)'}, var(--accent2))`, borderRadius: 5, transition: 'width .6s' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 5 }}>
                    <Stars rating={r.avgRating} size={12} />
                    <span style={{ fontSize: '.7rem', color: 'var(--text3)', marginLeft: 4 }}>{r.totalReviews} reviews</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {reports.map(r => (
                <div key={r.facultyId} className="card">
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{r.facultyName}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--text3)', marginBottom: 14 }}>{r.department}</div>
                  <Bar label="Teaching Quality" value={r.avgTeaching} />
                  <Bar label="Subject Knowledge" value={r.avgKnowledge} />
                  <Bar label="Communication" value={r.avgCommunication} />
                  <Bar label="Availability" value={r.avgAvailability} />
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '.72rem', color: 'var(--text3)', marginBottom: 8 }}>Rating Distribution</div>
                    {[5,4,3,2,1].map(s => {
                      const c = r.distribution?.[s] || 0;
                      const pct = r.totalReviews ? Math.round((c / r.totalReviews) * 100) : 0;
                      return (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: '.7rem' }}>
                          <span style={{ color: '#f59e0b', minWidth: 46 }}>{'★'.repeat(s)}</span>
                          <div style={{ flex: 1, height: 5, background: 'var(--surface2)', borderRadius: 3 }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: '#f59e0b', borderRadius: 3 }} />
                          </div>
                          <span style={{ color: 'var(--text3)', minWidth: 24, textAlign: 'right' }}>{c}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* SEMESTER COMPARISON TAB */}
      {tab === 'semester' && (
        loading ? <div className="loading">Loading...</div>
        : reports.length === 0 ? <div className="empty-state"><h3>No data yet</h3></div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: '10px 14px', background: 'rgba(79,142,247,.06)', border: '1px solid rgba(79,142,247,.2)', borderRadius: 8, fontSize: '.82rem', color: 'var(--text2)', marginBottom: 4 }}>
              💡 Click on any faculty to see their semester-wise breakdown.
            </div>
            {reports.map(r => (
              <div key={r.facultyId} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{r.facultyName}</div>
                    <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>{r.department}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>{r.avgRating}</div>
                      <div style={{ fontSize: '.68rem', color: 'var(--text3)' }}>Overall</div>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={() => openDetail(r.facultyId)}>Details →</button>
                  </div>
                </div>
                {r.semesters?.length > 0 ? (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {r.semesters.map(s => <span key={s} className="tag">{s}</span>)}
                  </div>
                ) : (
                  <div style={{ fontSize: '.78rem', color: 'var(--text3)' }}>No semester data available</div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* TOP FACULTY TAB */}
      {tab === 'top' && (
        topFaculty.length === 0
          ? <div className="empty-state"><h3>No ratings yet</h3><p>Top faculty appear here once reviews are approved.</p></div>
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: '.82rem', color: 'var(--text2)', marginBottom: 4 }}>
                Ranked by average rating from approved student reviews.
              </div>
              {topFaculty.map((f, i) => (
                <div key={f.facultyId} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}
                  onClick={() => openDetail(f.facultyId)}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0, background: i===0?'rgba(245,158,11,.2)':i===1?'rgba(139,150,176,.2)':i===2?'rgba(176,124,90,.2)':'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', color: i===0?'#f59e0b':i===1?'#8b96b0':i===2?'#c97d4e':'var(--text3)' }}>
                    {i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}
                  </div>
                  {f.profilePhoto ? (
                    <img src={`http://127.0.0.1:5000/uploads/${f.profilePhoto}`} alt={f.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(79,142,247,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>{ini(f.name)}</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '.95rem' }}>{f.name}</div>
                    <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>{f.designation||'Faculty'} · {f.department}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>{f.avgRating}</div>
                    <Stars rating={f.avgRating} size={13} />
                    <div style={{ fontSize: '.68rem', color: 'var(--text3)', marginTop: 2 }}>{f.totalReviews} review{f.totalReviews!==1?'s':''}</div>
                  </div>
                </div>
              ))}
            </div>
          )
      )}

      {/* DETAIL TAB */}
      {tab === 'detail' && (
        detailLoading ? <div className="loading">Loading faculty report...</div>
        : !selectedFaculty ? null
        : (
          <div>
            <button className="btn btn-secondary btn-sm" style={{ marginBottom: 16 }} onClick={() => setTab('reports')}>← Back to Reports</button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div className="card">
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
                  {selectedFaculty.faculty?.profilePhoto ? (
                    <img src={`http://127.0.0.1:5000/uploads/${selectedFaculty.faculty.profilePhoto}`} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(79,142,247,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.4rem', color: 'var(--accent)', flexShrink: 0 }}>{ini(selectedFaculty.faculty?.name)}</div>
                  )}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{selectedFaculty.faculty?.name}</div>
                    <div style={{ fontSize: '.8rem', color: 'var(--text2)' }}>{selectedFaculty.faculty?.designation}</div>
                    <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>{selectedFaculty.faculty?.department}</div>
                  </div>
                </div>
                {[['Qualification',selectedFaculty.faculty?.qualification],['Experience',selectedFaculty.faculty?.experience?`${selectedFaculty.faculty.experience} years`:null],['Status',selectedFaculty.faculty?.status]].filter(([,v])=>v).map(([l,v])=>(
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--surface2)', fontSize: '.82rem' }}>
                    <span style={{ color: 'var(--text3)' }}>{l}</span><span style={{ fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="card" style={{ textAlign: 'center' }}>
                {selectedFaculty.stats ? (
                  <>
                    <div style={{ fontSize: '3.5rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1, marginBottom: 8 }}>{selectedFaculty.stats.avgRating}</div>
                    <Stars rating={selectedFaculty.stats.avgRating} size={20} />
                    <div style={{ fontSize: '.8rem', color: 'var(--text3)', margin: '8px 0 16px' }}>Based on {selectedFaculty.stats.totalReviews} approved review{selectedFaculty.stats.totalReviews!==1?'s':''}</div>
                    <Bar label="Teaching Quality" value={selectedFaculty.stats.avgTeaching} />
                    <Bar label="Subject Knowledge" value={selectedFaculty.stats.avgKnowledge} />
                    <Bar label="Communication" value={selectedFaculty.stats.avgCommunication} />
                    <Bar label="Availability" value={selectedFaculty.stats.avgAvailability} />
                  </>
                ) : <div style={{ color: 'var(--text3)', padding: 20 }}>No approved reviews yet</div>}
              </div>
            </div>

            {selectedFaculty.stats && (
              <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 600, marginBottom: 14 }}>Rating Distribution</div>
                {[5,4,3,2,1].map(s => {
                  const c = selectedFaculty.stats.distribution?.[s] || 0;
                  const pct = selectedFaculty.stats.totalReviews ? Math.round((c/selectedFaculty.stats.totalReviews)*100) : 0;
                  return (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, fontSize: '.8rem' }}>
                      <span style={{ color: '#f59e0b', minWidth: 60 }}>{'★'.repeat(s)}</span>
                      <div style={{ flex: 1, height: 8, background: 'var(--surface2)', borderRadius: 4 }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: '#f59e0b', borderRadius: 4, transition: 'width .5s' }} />
                      </div>
                      <span style={{ color: 'var(--text3)', minWidth: 32 }}>{c}</span>
                      <span style={{ color: 'var(--text3)', minWidth: 36 }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedFaculty.semesterComparison?.length > 0 && (
              <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 600, marginBottom: 14 }}>Semester-wise Comparison</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                  {selectedFaculty.semesterComparison.map(s => (
                    <div key={s.semester} style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ fontSize: '.75rem', color: 'var(--text3)', marginBottom: 6 }}>{s.semester}</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>{s.avgRating}</div>
                      <Stars rating={s.avgRating} size={12} />
                      <div style={{ fontSize: '.7rem', color: 'var(--text3)', marginTop: 4 }}>{s.count} review{s.count!==1?'s':''}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedFaculty.reviews?.length > 0 && (
              <div className="card">
                <div style={{ fontWeight: 600, marginBottom: 14 }}>Student Reviews ({selectedFaculty.reviews.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {selectedFaculty.reviews.map(r => (
                    <div key={r._id} style={{ padding: '12px 14px', background: 'var(--surface2)', borderRadius: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '.85rem' }}>{r.reviewerLabel||'Anonymous Student'}</div>
                          <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{[r.subject,r.semester].filter(Boolean).join(' · ')}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <Stars rating={r.rating} size={14} />
                          <div style={{ fontSize: '.68rem', color: 'var(--text3)' }}>{r.rating}/5</div>
                        </div>
                      </div>
                      <p style={{ fontSize: '.82rem', lineHeight: 1.6, color: 'var(--text)', margin: 0 }}>{r.reviewText}</p>
                      {(r.teachingQuality||r.subjectKnowledge||r.communication||r.availability) && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                          {r.teachingQuality && <span className="tag">Teaching: {r.teachingQuality}★</span>}
                          {r.subjectKnowledge && <span className="tag">Knowledge: {r.subjectKnowledge}★</span>}
                          {r.communication && <span className="tag">Comm: {r.communication}★</span>}
                          {r.availability && <span className="tag">Avail: {r.availability}★</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}