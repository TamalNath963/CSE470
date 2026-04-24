import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createFaculty, getFacultyById, updateFaculty } from '../utils/api';
import toast from 'react-hot-toast';

const DEPARTMENTS = ['CSE', 'Mathematics', 'Physics', 'Chemistry', 'English', 'Business Administration', 'Civil Engineering', 'Electrical Engineering', 'Mechanical Engineering', 'Economics'];

const EMPTY = { name: '', email: '', department: '', designation: '', subjectsTaught: '', qualification: '', experience: '', phone: '', status: 'Active' };

export default function FacultyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    setFetching(true);
    getFacultyById(id).then(res => {
      const f = res.data.data;
      setForm({
        name: f.name || '',
        email: f.email || '',
        department: f.department || '',
        designation: f.designation || '',
        subjectsTaught: (f.subjectsTaught || []).join(', '),
        qualification: f.qualification || '',
        experience: f.experience || '',
        phone: f.phone || '',
        status: f.status || 'Active',
      });
    }).catch(() => toast.error('Failed to load faculty data'))
    .finally(() => setFetching(false));
  }, [id, isEdit]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    if (!form.name.trim()) { toast.error('Name is required'); return false; }
    if (!form.email.trim()) { toast.error('Email is required'); return false; }
    if (!/\S+@\S+\.\S+/.test(form.email)) { toast.error('Invalid email format'); return false; }
    if (!form.department.trim()) { toast.error('Department is required'); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = { ...form, subjectsTaught: form.subjectsTaught };
      if (isEdit) {
        await updateFaculty(id, payload);
        toast.success('Faculty profile updated!');
      } else {
        await createFaculty(payload);
        toast.success('Faculty profile created!');
      }
      navigate('/faculty');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          {isEdit ? <><span>Edit</span> Faculty Profile</> : <>Add <span>New Faculty</span></>}
        </h1>
        <button className="btn btn-secondary" onClick={() => navigate('/faculty')}>← Back to Directory</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 900 }}>
        {/* Left column */}
        <div className="card">
          <div style={{ fontSize: '.75rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, fontWeight: 600 }}>
            Basic Information
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Dr. Ayesha Rahman" required />
            </div>
            <div className="form-group">
              <label>Email Address *</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="faculty@university.edu" required />
            </div>
            <div className="form-group">
              <label>Department *</label>
              <select value={form.department} onChange={e => set('department', e.target.value)} required>
                <option value="">-- Select Department --</option>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Designation</label>
              <select value={form.designation} onChange={e => set('designation', e.target.value)}>
                <option value="">-- Select --</option>
                <option>Professor</option>
                <option>Associate Professor</option>
                <option>Assistant Professor</option>
                <option>Lecturer</option>
                <option>Senior Lecturer</option>
                <option>Visiting Faculty</option>
              </select>
            </div>
            <div className="form-group">
              <label>Subjects Taught <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(comma separated)</span></label>
              <input value={form.subjectsTaught} onChange={e => set('subjectsTaught', e.target.value)}
                placeholder="e.g. Data Structures, Algorithms, DBMS" />
            </div>
            <div className="form-group">
              <label>Status</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {['Active', 'On Leave', 'Retired'].map(s => (
                  <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', textTransform: 'none', letterSpacing: 0, fontWeight: form.status === s ? 600 : 400, color: form.status === s ? 'var(--accent)' : 'var(--text2)', fontSize: '.85rem' }}>
                    <input type="radio" name="status" value={s} checked={form.status === s} onChange={() => set('status', s)} style={{ width: 'auto' }} />
                    {s}
                  </label>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Right column */}
        <div className="card">
          <div style={{ fontSize: '.75rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, fontWeight: 600 }}>
            Professional Details
          </div>
          <div className="form-group">
            <label>Qualification</label>
            <select value={form.qualification} onChange={e => set('qualification', e.target.value)}>
              <option value="">-- Select --</option>
              <option>PhD</option><option>M.Phil</option><option>Masters</option>
              <option>M.Tech</option><option>MBA</option><option>B.Tech</option><option>Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Experience (years)</label>
            <input type="number" min="0" max="60" value={form.experience} onChange={e => set('experience', e.target.value)} placeholder="e.g. 5" />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="e.g. +880 1711 234567" />
          </div>

          {/* Status summary card */}
          <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: 14, marginTop: 8 }}>
            <div style={{ fontSize: '.75rem', color: 'var(--text3)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Preview</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(79,142,247,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--accent)', fontSize: '1rem' }}>
                {form.name ? form.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??'}
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{form.name || 'Faculty Name'}</div>
                <div style={{ fontSize: '.75rem', color: 'var(--text2)' }}>{form.designation || 'Designation'} · {form.department || 'Department'}</div>
                <div style={{ fontSize: '.72rem', color: form.status === 'Active' ? 'var(--success)' : form.status === 'On Leave' ? 'var(--warning)' : 'var(--text3)', marginTop: 3, fontWeight: 600 }}>● {form.status}</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleSubmit} disabled={loading}>
              {loading ? 'Saving...' : isEdit ? '💾 Update Profile' : '✅ Create Profile'}
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/faculty')}>Cancel</button>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(79,142,247,.06)', border: '1px solid rgba(79,142,247,.2)', borderRadius: 8, fontSize: '.8rem', color: 'var(--text2)', maxWidth: 900 }}>
        💡 <strong>Tip:</strong> After creating the profile, you can upload a profile photo from the faculty directory.
      </div>
    </div>
  );
}