import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import toast from 'react-hot-toast';


const ROLES = [
  { value: 'student', label: '🎓 Student', desc: 'Submit reviews for faculty members' },
  { value: 'faculty', label: '👨‍🏫 Faculty', desc: 'View your reviews and performance reports' },
  { value: 'admin', label: '🛡 Admin', desc: 'Full system access and management' },
];

export default function SignupPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'student', department: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState(1);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validateStep1 = () => {
    if (!form.name.trim()) { toast.error('Name is required'); return false; }
    if (!form.email.trim()) { toast.error('Email is required'); return false; }
    if (!/\S+@\S+\.\S+/.test(form.email)) { toast.error('Invalid email format'); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!form.password) { toast.error('Password is required'); return false; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return false; }
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return false; }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await API.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        department: form.department,
      });
      login(res.data.token, res.data.user);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const strength = () => {
    const p = form.password;
    if (!p) return { label: '', color: '#2a3347', width: '0%' };
    if (p.length < 6) return { label: 'Too short', color: '#ef4444', width: '20%' };
    if (p.length < 8) return { label: 'Weak', color: '#f59e0b', width: '40%' };
    if (!/[A-Z]/.test(p) || !/[0-9]/.test(p)) return { label: 'Fair', color: '#3b82f6', width: '65%' };
    return { label: 'Strong', color: '#22c55e', width: '100%' };
  };
  const pw = strength();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0d0f14' }}>
      {/* Left panel */}
      <div style={{ width: 300, display: 'flex', flexDirection: 'column', padding: '40px 28px', background: '#161b25', borderRight: '1px solid #2a3347' }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎓</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#e8ecf4', letterSpacing: '-0.5px' }}>FacultyHub</h2>
          <p style={{ color: '#5a6480', fontSize: '.78rem', marginTop: 4 }}>Review & Evaluation System</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[['Personal Info', 'Name & Email'], ['Security', 'Password'], ['Role', 'Account Type']].map(([title, sub], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '.82rem', flexShrink: 0,
                background: step > i + 1 ? '#22c55e' : step === i + 1 ? '#4f8ef7' : '#1e2535',
                color: step >= i + 1 ? 'white' : '#5a6480',
                border: `2px solid ${step > i + 1 ? '#22c55e' : step === i + 1 ? '#4f8ef7' : '#2a3347'}`,
              }}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <div>
                <div style={{ fontSize: '.82rem', fontWeight: 600, color: step >= i + 1 ? '#e8ecf4' : '#5a6480' }}>{title}</div>
                <div style={{ fontSize: '.68rem', color: '#5a6480' }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid #2a3347' }}>
          <p style={{ fontSize: '.72rem', color: '#5a6480', lineHeight: 1.6 }}>
            By creating an account you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ marginBottom: 22 }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#e8ecf4', letterSpacing: '-0.5px' }}>
              {step === 1 ? 'Create your account' : step === 2 ? 'Secure your account' : 'Choose your role'}
            </h2>
            <p style={{ color: '#5a6480', marginTop: 5, fontSize: '.8rem' }}>Step {step} of 3</p>
            <div style={{ height: 3, background: '#2a3347', borderRadius: 3, marginTop: 12 }}>
              <div style={{ width: `${(step / 3) * 100}%`, height: '100%', background: '#4f8ef7', borderRadius: 3, transition: 'width .3s ease' }} />
            </div>
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: '.72rem', fontWeight: 600, color: '#8b96b0', textTransform: 'uppercase', letterSpacing: '.4px', display: 'block', marginBottom: 4 }}>Full Name *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Dr. Jane Smith"
                  style={{ background: '#1e2535', border: '1px solid #2a3347', borderRadius: 8, padding: '10px 14px', color: '#e8ecf4', fontSize: '.85rem', width: '100%', outline: 'none', fontFamily: 'inherit' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: '.72rem', fontWeight: 600, color: '#8b96b0', textTransform: 'uppercase', letterSpacing: '.4px', display: 'block', marginBottom: 4 }}>Email Address *</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@university.edu"
                  style={{ background: '#1e2535', border: '1px solid #2a3347', borderRadius: 8, padding: '10px 14px', color: '#e8ecf4', fontSize: '.85rem', width: '100%', outline: 'none', fontFamily: 'inherit' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: '.72rem', fontWeight: 600, color: '#8b96b0', textTransform: 'uppercase', letterSpacing: '.4px', display: 'block', marginBottom: 4 }}>Department (optional)</label>
                <input value={form.department} onChange={e => set('department', e.target.value)} placeholder="Computer Science"
                  style={{ background: '#1e2535', border: '1px solid #2a3347', borderRadius: 8, padding: '10px 14px', color: '#e8ecf4', fontSize: '.85rem', width: '100%', outline: 'none', fontFamily: 'inherit' }} />
              </div>
            </>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <>
              <div style={{ marginBottom: 8, position: 'relative' }}>
                <label style={{ fontSize: '.72rem', fontWeight: 600, color: '#8b96b0', textTransform: 'uppercase', letterSpacing: '.4px', display: 'block', marginBottom: 4 }}>Password *</label>
                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)}
                  placeholder="At least 6 characters"
                  style={{ background: '#1e2535', border: '1px solid #2a3347', borderRadius: 8, padding: '10px 44px 10px 14px', color: '#e8ecf4', fontSize: '.85rem', width: '100%', outline: 'none', fontFamily: 'inherit' }} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 12, bottom: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
              {form.password && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ height: 4, background: '#2a3347', borderRadius: 2, marginBottom: 4 }}>
                    <div style={{ width: pw.width, height: '100%', background: pw.color, borderRadius: 2, transition: 'all .3s' }} />
                  </div>
                  <div style={{ fontSize: '.7rem', color: pw.color }}>{pw.label}</div>
                </div>
              )}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: '.72rem', fontWeight: 600, color: '#8b96b0', textTransform: 'uppercase', letterSpacing: '.4px', display: 'block', marginBottom: 4 }}>Confirm Password *</label>
                <input type={showPass ? 'text' : 'password'} value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)}
                  placeholder="Re-enter password"
                  style={{ background: '#1e2535', border: `1px solid ${form.confirmPassword && form.confirmPassword !== form.password ? '#ef4444' : '#2a3347'}`, borderRadius: 8, padding: '10px 14px', color: '#e8ecf4', fontSize: '.85rem', width: '100%', outline: 'none', fontFamily: 'inherit' }} />
                {form.confirmPassword && form.confirmPassword !== form.password && (
                  <div style={{ fontSize: '.7rem', color: '#ef4444', marginTop: 4 }}>Passwords don't match</div>
                )}
              </div>
            </>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 8 }}>
              {ROLES.map(r => (
                <div key={r.value} onClick={() => set('role', r.value)} style={{
                  padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                  border: `2px solid ${form.role === r.value ? '#4f8ef7' : '#2a3347'}`,
                  background: form.role === r.value ? 'rgba(79,142,247,.08)' : '#1e2535',
                  transition: 'all .15s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.2rem' }}>{r.label.split(' ')[0]}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '.88rem', color: form.role === r.value ? '#4f8ef7' : '#e8ecf4' }}>
                        {r.label.split(' ').slice(1).join(' ')}
                      </div>
                      <div style={{ fontSize: '.72rem', color: '#5a6480', marginTop: 2 }}>{r.desc}</div>
                    </div>
                    {form.role === r.value && <div style={{ marginLeft: 'auto', color: '#4f8ef7' }}>✓</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            {step > 1 && (
              <button onClick={handleBack} style={{ flex: 1, padding: '12px 20px', borderRadius: 8, border: '1px solid #2a3347', background: '#1e2535', color: '#e8ecf4', fontSize: '.88rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                ← Back
              </button>
            )}
            <button
              onClick={step < 3 ? handleNext : handleCreate}
              disabled={loading}
              style={{ flex: 1, padding: '12px 20px', borderRadius: 8, border: 'none', background: '#4f8ef7', color: 'white', fontSize: '.88rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1, fontFamily: 'inherit' }}>
              {loading ? 'Creating...' : step < 3 ? 'Continue →' : '🎉 Create Account'}
            </button>
          </div>

          <div style={{ borderTop: '1px solid #2a3347', marginTop: 18, paddingTop: 14, textAlign: 'center' }}>
            <span style={{ fontSize: '.82rem', color: '#8b96b0' }}>Already have an account? </span>
            <Link to="/login" style={{ color: '#4f8ef7', fontWeight: 600, fontSize: '.82rem' }}>Sign in →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}