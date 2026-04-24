import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import toast from 'react-hot-toast';

const DEPARTMENTS = ['CSE', 'Mathematics', 'Physics', 'Chemistry', 'English',
  'Business Administration', 'Civil Engineering', 'Electrical Engineering',
  'Mechanical Engineering', 'Economics', 'Other'];

export default function AdminProfile() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(
    user?.profilePhoto ? `http://127.0.0.1:5000/uploads/${user.profilePhoto}` : null
  );
  const [form, setForm] = useState({
    name: user?.name || '',
    department: user?.department || '',
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (user?.profilePhoto) setPhotoPreview(`http://127.0.0.1:5000/uploads/${user.profilePhoto}`);
  }, [user?.profilePhoto]);

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

  const handlePhotoUpload = async () => {
    if (!photoFile) { toast.error('Please select a photo first'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('photo', photoFile);
      const res = await API.post('/auth/upload-photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const newFilename = res.data.filename;
      const token = localStorage.getItem('fh_token');
      const updatedUser = { ...user, profilePhoto: newFilename };
      localStorage.setItem('fh_user', JSON.stringify(updatedUser));
      login(token, updatedUser);
      setPhotoFile(null);
      toast.success('Profile photo saved!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setLoading(true);
    try {
      const res = await API.put('/auth/update-profile', { name: form.name.trim(), department: form.department });
      const updated = res.data.data;
      const token = localStorage.getItem('fh_token');
      const updatedUser = { ...user, name: updated.name, department: updated.department, profilePhoto: user.profilePhoto };
      localStorage.setItem('fh_user', JSON.stringify(updatedUser));
      login(token, updatedUser);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!pwForm.currentPassword) { toast.error('Enter current password'); return; }
    if (pwForm.newPassword.length < 6) { toast.error('New password must be 6+ characters'); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await API.put('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const pwStr = () => {
    const p = pwForm.newPassword;
    if (!p) return { label: '', color: 'var(--border)', w: '0%' };
    if (p.length < 6) return { label: 'Too short', color: 'var(--danger)', w: '20%' };
    if (p.length < 8) return { label: 'Weak', color: 'var(--warning)', w: '40%' };
    if (!/[A-Z]/.test(p) || !/[0-9]/.test(p)) return { label: 'Fair', color: '#3b82f6', w: '65%' };
    return { label: 'Strong', color: 'var(--success)', w: '100%' };
  };
  const pw = pwStr();
  const ini = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'A';

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Admin <span>Profile</span></h1>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>← Dashboard</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, maxWidth: 860 }}>

        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 14 }}>
              {photoPreview ? (
                <img src={photoPreview} alt="Profile"
                  style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid #ef4444', margin: '0 auto', display: 'block' }}
                  onError={() => setPhotoPreview(null)} />
              ) : (
                <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'rgba(239,68,68,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.8rem', color: '#ef4444', margin: '0 auto', border: '3px solid var(--border)' }}>
                  {ini}
                </div>
              )}
            </div>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{user?.name}</div>
            <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: '.68rem', fontWeight: 600, background: 'rgba(239,68,68,.15)', color: '#ef4444' }}>
              🛡 Admin
            </span>
            {user?.department && <div style={{ fontSize: '.75rem', color: 'var(--text3)', marginTop: 6 }}>{user.department}</div>}
            <div style={{ fontSize: '.72rem', color: 'var(--text3)', marginTop: 4, marginBottom: 14, wordBreak: 'break-all' }}>{user?.email}</div>

            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
            <button type="button" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', marginBottom: 6 }}
              onClick={() => fileRef.current?.click()}>
              📷 {photoPreview && !photoFile ? 'Change Photo' : 'Choose Photo'}
            </button>
            {photoFile && (
              <>
                <div style={{ fontSize: '.68rem', color: 'var(--text3)', marginBottom: 7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{photoFile.name}</div>
                <button type="button" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                  onClick={handlePhotoUpload} disabled={loading}>
                  {loading ? 'Uploading...' : '⬆️ Save Photo'}
                </button>
              </>
            )}
          </div>

          <div className="card">
            <div style={{ fontSize: '.7rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, fontWeight: 600 }}>Account Info</div>
            {[['Role', '🛡 Administrator'], ['Email', user?.email], ['Department', user?.department || 'Not set']].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--surface2)', fontSize: '.8rem' }}>
                <span style={{ color: 'var(--text3)' }}>{l}</span>
                <span style={{ color: 'var(--text2)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right */}
        <div>
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
            {[['profile', '👤 Profile Info'], ['password', '🔒 Change Password']].map(([id, label]) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{
                padding: '10px 20px', background: 'none', border: 'none',
                borderBottom: `2px solid ${activeTab === id ? 'var(--accent)' : 'transparent'}`,
                color: activeTab === id ? 'var(--accent)' : 'var(--text2)',
                fontWeight: activeTab === id ? 700 : 400, cursor: 'pointer',
                fontSize: '.88rem', fontFamily: 'inherit', transition: 'all .15s',
              }}>{label}</button>
            ))}
          </div>

          {activeTab === 'profile' && (
            <div className="card">
              <div style={{ fontSize: '.72rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 18, fontWeight: 600 }}>Personal Information</div>
              <form onSubmit={handleProfileSave}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your full name" required />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input value={user?.email || ''} disabled style={{ opacity: .6, cursor: 'not-allowed' }} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label>Department</label>
                    <select value={form.department} onChange={e => set('department', e.target.value)}>
                      <option value="">-- Select department --</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, fontSize: '.8rem', color: 'var(--text2)', marginBottom: 16 }}>
                  🛡 You have full admin access to manage faculty, reviews, courses and system settings.
                </div>
                <button type="submit" className="btn btn-primary" style={{ padding: '11px 24px', justifyContent: 'center' }} disabled={loading}>
                  {loading ? 'Saving...' : '💾 Save Changes'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="card">
              <div style={{ fontSize: '.72rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 18, fontWeight: 600 }}>Change Password</div>
              <form onSubmit={handlePasswordChange}>
                <div style={{ maxWidth: 400 }}>
                  <div className="form-group" style={{ position: 'relative' }}>
                    <label>Current Password *</label>
                    <input type={showPw ? 'text' : 'password'} value={pwForm.currentPassword}
                      onChange={e => setPw('currentPassword', e.target.value)} placeholder="Enter current password"
                      style={{ paddingRight: 42 }} required />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      style={{ position: 'absolute', right: 12, bottom: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>
                      {showPw ? '🙈' : '👁'}
                    </button>
                  </div>
                  <div className="form-group">
                    <label>New Password *</label>
                    <input type={showPw ? 'text' : 'password'} value={pwForm.newPassword}
                      onChange={e => setPw('newPassword', e.target.value)} placeholder="Min 6 characters" required />
                    {pwForm.newPassword && (
                      <div style={{ marginTop: 6 }}>
                        <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginBottom: 4 }}>
                          <div style={{ width: pw.w, height: '100%', background: pw.color, borderRadius: 2, transition: 'all .3s' }} />
                        </div>
                        <div style={{ fontSize: '.7rem', color: pw.color }}>{pw.label}</div>
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Confirm New Password *</label>
                    <input type={showPw ? 'text' : 'password'} value={pwForm.confirmPassword}
                      onChange={e => setPw('confirmPassword', e.target.value)} placeholder="Re-enter new password"
                      style={{ borderColor: pwForm.confirmPassword && pwForm.confirmPassword !== pwForm.newPassword ? 'var(--danger)' : undefined }} required />
                    {pwForm.confirmPassword && pwForm.confirmPassword !== pwForm.newPassword && (
                      <div style={{ fontSize: '.72rem', color: 'var(--danger)', marginTop: 4 }}>Passwords don't match</div>
                    )}
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ padding: '11px 24px', justifyContent: 'center', marginTop: 4 }} disabled={loading}>
                    {loading ? 'Updating...' : '🔒 Update Password'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}