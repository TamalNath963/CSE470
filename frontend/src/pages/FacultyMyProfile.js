import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllFaculty, updateFaculty, uploadFacultyPhoto, changePassword } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import toast from 'react-hot-toast';

const DEPARTMENTS = ['CSE', 'Mathematics', 'Physics', 'Chemistry', 'English',
  'Business Administration', 'Civil Engineering', 'Electrical Engineering',
  'Mechanical Engineering', 'Economics', 'Other'];

export default function FacultyMyProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef();
  const [activeTab, setActiveTab] = useState('profile');

  const [myProfile, setMyProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Password form
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || '',
    designation: '',
    subjectsTaught: '',
    qualification: '',
    experience: '',
    phone: '',
    status: 'Active',
  });

  useEffect(() => {
    getAllFaculty()
      .then(res => {
        const list = res?.data?.data;
        if (Array.isArray(list)) {
          const existing = list.find(f =>
            f.email?.toLowerCase().trim() === user?.email?.toLowerCase().trim()
          );
          if (existing) {
            setMyProfile(existing);
            setForm({
              name: existing.name || '',
              email: existing.email || '',
              department: existing.department || '',
              designation: existing.designation || '',
              subjectsTaught: Array.isArray(existing.subjectsTaught)
                ? existing.subjectsTaught.join(', ') : '',
              qualification: existing.qualification || '',
              experience: String(existing.experience || ''),
              phone: existing.phone || '',
              status: existing.status || 'Active',
            });
            if (existing.profilePhoto) {
              setPhotoPreview(`http://127.0.0.1:5000/uploads/${existing.profilePhoto}`);
            }
          }
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [user]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setPw = (k, v) => setPwForm(f => ({ ...f, [k]: v }));

  const handlePhotoChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { toast.error('Only image files allowed'); return; }
    if (f.size > 5 * 1024 * 1024) { toast.error('Max file size is 5MB'); return; }
    setPhotoFile(f);
    setPhotoPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (!form.department) { toast.error('Department is required'); return; }
    setLoading(true);
    try {
      let profileId = myProfile?._id;
      const payload = {
        name: form.name.trim(), email: form.email.trim(),
        department: form.department, designation: form.designation,
        subjectsTaught: form.subjectsTaught, qualification: form.qualification,
        experience: form.experience, phone: form.phone, status: form.status,
      };
      if (myProfile) {
        await updateFaculty(myProfile._id, payload);
        toast.success('Profile updated successfully!');
      } else {
        const res = await API.post('/faculty', payload);
        if (!res.data.success) { toast.error(res.data.message || 'Failed to create profile'); setLoading(false); return; }
        profileId = res.data.data._id;
        toast.success('Profile created successfully!');
      }
      if (photoFile && profileId) {
        const fd = new FormData();
        fd.append('photo', photoFile);
        await uploadFacultyPhoto(profileId, fd);
        toast.success('Photo uploaded!');
      }
      navigate('/');
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwForm.currentPassword) { toast.error('Enter current password'); return; }
    if (pwForm.newPassword.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    setPwLoading(true);
    try {
      await changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  if (fetching) return <div className="loading">Loading your profile...</div>;

  const ini = form.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          {myProfile ? <>Update <span>My Profile</span></> : <>Create <span>My Profile</span></>}
        </h1>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>← Back to Dashboard</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, maxWidth: 900 }}>

        {/* Left — photo & status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 14 }}>
              {photoPreview ? (
                <img src={photoPreview} alt="Profile"
                  style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)', margin: '0 auto', display: 'block' }} />
              ) : (
                <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(79,142,247,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.8rem', color: 'var(--accent)', margin: '0 auto', border: '3px solid var(--border)' }}>
                  {ini}
                </div>
              )}
            </div>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{form.name || 'Your Name'}</div>
            <div style={{ fontSize: '.78rem', color: 'var(--text2)', marginBottom: 2 }}>{form.designation || 'Designation'}</div>
            <div style={{ fontSize: '.75rem', color: 'var(--text3)', marginBottom: 14 }}>{form.department || 'Department'}</div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
            <button type="button" className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center', marginBottom: 6 }}
              onClick={() => fileRef.current?.click()}>
              📷 {photoPreview ? 'Change Photo' : 'Upload Photo'}
            </button>
            {photoFile && (
              <div style={{ fontSize: '.68rem', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {photoFile.name}
              </div>
            )}
          </div>

          <div className="card">
            <div style={{ fontSize: '.72rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, fontWeight: 600 }}>Status</div>
            {[{ value: 'Active', icon: '🟢', color: 'var(--success)' },
              { value: 'On Leave', icon: '🟡', color: 'var(--warning)' },
              { value: 'Retired', icon: '⚪', color: 'var(--text2)' }].map(s => (
              <label key={s.value} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, cursor: 'pointer', fontSize: '.85rem', fontWeight: form.status === s.value ? 700 : 400, color: form.status === s.value ? s.color : 'var(--text2)' }}>
                <input type="radio" name="status" value={s.value} checked={form.status === s.value} onChange={() => set('status', s.value)} style={{ width: 'auto' }} />
                {s.icon} {s.value}
              </label>
            ))}
          </div>
        </div>

        {/* Right — tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* Tab headers */}
          <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', marginBottom: 16 }}>
            {[
              { key: 'profile', label: '👤 Profile Info' },
              { key: 'password', label: '🔒 Change Password' },
            ].map(tab => (
              <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: '.88rem', fontWeight: 600,
                  color: activeTab === tab.key ? 'var(--accent)' : 'var(--text2)',
                  borderBottom: `2px solid ${activeTab === tab.key ? 'var(--accent)' : 'transparent'}`,
                  marginBottom: -2, transition: 'all .15s',
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card">
                <div style={{ fontSize: '.72rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, fontWeight: 600 }}>Basic Information</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Dr. Your Name" required />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input value={form.email} disabled style={{ opacity: .6, cursor: 'not-allowed' }} />
                  </div>
                  <div className="form-group">
                    <label>Department *</label>
                    <select value={form.department} onChange={e => set('department', e.target.value)} required>
                      <option value="">-- Select Department --</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
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
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Subjects Taught <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(comma separated)</span></label>
                    <input value={form.subjectsTaught} onChange={e => set('subjectsTaught', e.target.value)}
                      placeholder="e.g. Data Structures, Algorithms, DBMS" />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+880 1711 234567" />
                  </div>
                </div>
              </div>

              <div className="card">
                <div style={{ fontSize: '.72rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, fontWeight: 600 }}>Professional Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label>Highest Qualification</label>
                    <select value={form.qualification} onChange={e => set('qualification', e.target.value)}>
                      <option value="">-- Select --</option>
                      <option>PhD</option><option>M.Phil</option><option>Masters</option>
                      <option>M.Tech</option><option>MBA</option><option>B.Tech</option><option>Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Years of Experience</label>
                    <input type="number" min="0" max="60" value={form.experience}
                      onChange={e => set('experience', e.target.value)} placeholder="e.g. 5" />
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary"
                style={{ padding: '13px 24px', fontSize: '.95rem', justifyContent: 'center' }}
                disabled={loading}>
                {loading ? 'Saving...' : myProfile ? '💾 Update My Profile' : '✅ Create My Profile'}
              </button>
            </form>
          )}

          {/* Change Password Tab */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card">
                <div style={{ fontSize: '.72rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20, fontWeight: 600 }}>Change Password</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 400 }}>
                  <div className="form-group">
                    <label>Current Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={pwForm.currentPassword}
                        onChange={e => setPw('currentPassword', e.target.value)}
                        placeholder="Enter current password"
                        required
                        style={{ paddingRight: 40 }}
                      />
                      <button type="button" onClick={() => setShowPw(!showPw)}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>
                        {showPw ? '🙈' : '👁'}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={pwForm.newPassword}
                      onChange={e => setPw('newPassword', e.target.value)}
                      placeholder="Min 6 characters"
                      required
                    />
                    {pwForm.newPassword && pwForm.newPassword.length < 6 && (
                      <div style={{ fontSize: '.72rem', color: 'var(--danger)', marginTop: 4 }}>At least 6 characters required</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={pwForm.confirmPassword}
                      onChange={e => setPw('confirmPassword', e.target.value)}
                      placeholder="Re-enter new password"
                      required
                    />
                    {pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                      <div style={{ fontSize: '.72rem', color: 'var(--danger)', marginTop: 4 }}>Passwords do not match</div>
                    )}
                  </div>
                </div>
              </div>
              <button type="submit" className="btn btn-primary"
                style={{ padding: '13px 24px', fontSize: '.95rem', justifyContent: 'center', maxWidth: 220 }}
                disabled={pwLoading}>
                {pwLoading ? 'Updating...' : '🔒 Change Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}