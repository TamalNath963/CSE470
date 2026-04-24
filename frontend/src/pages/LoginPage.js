import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('All fields required'); return; }
    setLoading(true);
    try {
      const res = await API.post('/auth/login', form);
      login(res.data.token, res.data.user);
      toast.success(`Welcome back, ${res.data.user.name}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    const demos = {
      admin: { email: 'admin@facultyhub.edu', password: 'admin123' },
      faculty: { email: 'faculty@facultyhub.edu', password: 'faculty123' },
      student: { email: 'student@facultyhub.edu', password: 'student123' },
    };
    setForm(demos[role]);
  };

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.brand}>
          <div style={styles.brandIcon}>🎓</div>
          <h1 style={styles.brandName}>FacultyHub</h1>
          <p style={styles.brandTagline}>Review & Evaluation System</p>
        </div>
        <div style={styles.features}>
          {[
            ['📊', 'Performance Reports', 'Generate detailed faculty performance analytics'],
            ['⭐', 'Review System', 'Collect and manage student reviews seamlessly'],
            ['📚', 'Course Management', 'Track courses, subjects, and assignments'],
            ['🛡', 'Admin Controls', 'Full control over users, reviews, and settings'],
          ].map(([icon, title, desc]) => (
            <div key={title} style={styles.featureItem}>
              <span style={styles.featureIcon}>{icon}</span>
              <div>
                <div style={styles.featureTitle}>{title}</div>
                <div style={styles.featureDesc}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Welcome back</h2>
            <p style={styles.cardSub}>Sign in to your account</p>
          </div>

          {/* Demo accounts */}
          <div style={styles.demoRow}>
            <span style={styles.demoLabel}>Quick demo:</span>
            {['admin', 'faculty', 'student'].map(r => (
              <button key={r} style={styles.demoBtn} onClick={() => fillDemo(r)}>
                {r}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="you@university.edu"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group" style={{ position: 'relative' }}>
              <label>Password</label>
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={styles.eyeBtn}
              >
                {showPass ? '🙈' : '👁'}
              </button>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '12px 20px', fontSize: '.95rem' }}
            >
              {loading ? 'Signing in...' : '🔐 Sign In'}
            </button>
          </form>

          <div style={styles.divider}><span>or</span></div>

          <p style={styles.switchText}>
            Don't have an account?{' '}
            <Link to="/signup" style={styles.link}>Create account →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { display: 'flex', minHeight: '100vh', background: 'var(--bg)' },
  left: {
    flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
    padding: '60px 48px', background: 'linear-gradient(135deg, #0d0f14 0%, #161b25 100%)',
    borderRight: '1px solid var(--border)',
  },
  brand: { marginBottom: 48 },
  brandIcon: { fontSize: '3rem', marginBottom: 12 },
  brandName: { fontSize: '2.2rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-1px', margin: 0 },
  brandTagline: { fontSize: '.9rem', color: 'var(--text3)', marginTop: 6 },
  features: { display: 'flex', flexDirection: 'column', gap: 22 },
  featureItem: { display: 'flex', alignItems: 'flex-start', gap: 14 },
  featureIcon: { fontSize: '1.4rem', marginTop: 2, flexShrink: 0 },
  featureTitle: { fontWeight: 700, fontSize: '.92rem', marginBottom: 3 },
  featureDesc: { fontSize: '.78rem', color: 'var(--text3)', lineHeight: 1.5 },
  right: {
    width: 480, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '40px 40px', background: 'var(--surface)',
  },
  card: { width: '100%', maxWidth: 400 },
  cardHeader: { marginBottom: 28, textAlign: 'center' },
  cardTitle: { fontSize: '1.6rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' },
  cardSub: { color: 'var(--text3)', marginTop: 6, fontSize: '.88rem' },
  demoRow: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
    background: 'var(--surface2)', borderRadius: 8, marginBottom: 20, flexWrap: 'wrap',
  },
  demoLabel: { fontSize: '.72rem', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5 },
  demoBtn: {
    background: 'rgba(79,142,247,.12)', border: '1px solid rgba(79,142,247,.25)', color: 'var(--accent)',
    borderRadius: 6, padding: '3px 10px', fontSize: '.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
  eyeBtn: {
    position: 'absolute', right: 12, top: '50%', marginTop: 10, transform: 'none',
    background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: 4,
  },
  divider: {
    textAlign: 'center', margin: '20px 0', position: 'relative',
    '::before': { content: '""', position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'var(--border)' },
  },
  switchText: { textAlign: 'center', fontSize: '.85rem', color: 'var(--text2)', margin: 0 },
  link: { color: 'var(--accent)', fontWeight: 600 },
};