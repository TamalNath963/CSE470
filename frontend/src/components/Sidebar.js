import { NavLink, useNavigate } from 'react-router-dom';
import { FiUsers, FiSearch, FiHome, FiStar, FiShield, FiBarChart2, FiSettings, FiLogOut, FiUser, FiUserPlus, FiMessageSquare } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { getAllFaculty } from '../utils/api';
import toast from 'react-hot-toast';

const NavSection = ({ title, children }) => (
  <div style={{ marginBottom: 4 }}>
    <div style={{ fontSize: '.6rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1.2, padding: '10px 20px 4px' }}>
      {title}
    </div>
    {children}
  </div>
);

const roleColors  = { admin: '#ef4444', faculty: '#4f8ef7', student: '#22c55e' };
const roleLabels  = { admin: '🛡 Admin', faculty: '👨‍🏫 Faculty', student: '🎓 Student' };
const avatarBg    = { admin: 'rgba(239,68,68,.15)', faculty: 'rgba(79,142,247,.15)', student: 'rgba(34,197,94,.15)' };

export default function Sidebar() {
  const { user, logout, isAdmin, isFaculty } = useAuth();
  const navigate = useNavigate();
  const isStudent = user?.role === 'student';
  const [profilePhoto, setProfilePhoto] = useState(null);

  useEffect(() => {
    if (!user?.email) return;
    if (isFaculty) {
      getAllFaculty()
        .then(res => {
          const list = res?.data?.data;
          if (Array.isArray(list)) {
            const me = list.find(f => f.email?.toLowerCase().trim() === user.email?.toLowerCase().trim());
            if (me?.profilePhoto) setProfilePhoto(`http://127.0.0.1:5000/uploads/${me.profilePhoto}`);
          }
        }).catch(() => {});
    } else if (user?.profilePhoto) {
      setProfilePhoto(`http://127.0.0.1:5000/uploads/${user.profilePhoto}`);
    }
  }, [isFaculty, user]);

  useEffect(() => {
    if (!isFaculty && user?.profilePhoto) {
      setProfilePhoto(`http://127.0.0.1:5000/uploads/${user.profilePhoto}`);
    }
  }, [user?.profilePhoto]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>🎓 FacultyHub</h2>
        <p>Review & Evaluation System</p>
      </div>

      {/* User card */}
      {user && (
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          {profilePhoto ? (
            <img src={profilePhoto} alt={user.name}
              style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${roleColors[user.role]}`, flexShrink: 0 }}
              onError={() => setProfilePhoto(null)} />
          ) : (
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: avatarBg[user.role] || 'rgba(79,142,247,.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '.82rem', fontWeight: 700,
              color: roleColors[user.role] || 'var(--accent)',
              flexShrink: 0, border: `2px solid ${roleColors[user.role]}44`,
            }}>
              {initials}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name}
            </div>
            <div style={{ fontSize: '.64rem', color: roleColors[user.role], fontWeight: 600, marginTop: 1 }}>
              {roleLabels[user.role]}
            </div>
          </div>
        </div>
      )}

      <nav style={{ flex: 1, overflowY: 'auto' }}>

        <NavSection title="Overview">
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
            <FiHome size={15} /> Dashboard
          </NavLink>
        </NavSection>

        {/* My Account — all roles */}
        <NavSection title="My Account">
          {isAdmin && (
            <NavLink to="/admin-profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <FiUser size={15} /> My Profile
            </NavLink>
          )}
          {isFaculty && (
            <NavLink to="/faculty/create-my-profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <FiUser size={15} /> My Profile
            </NavLink>
          )}
          {isStudent && (
            <NavLink to="/my-profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <FiUser size={15} /> My Profile
            </NavLink>
          )}
        </NavSection>

        <NavSection title="Faculty">
          <NavLink to="/faculty" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <FiUsers size={15} /> Directory
          </NavLink>
          <NavLink to="/faculty/search" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <FiSearch size={15} /> Search Faculty
          </NavLink>
          {isAdmin && (
            <NavLink to="/faculty/new" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <FiUserPlus size={15} /> Add Faculty
            </NavLink>
          )}
        </NavSection>

        {/* ── ORDER: Admin → Reviews → Reports ── */}

        {isAdmin && (
          <NavSection title="Admin">
            <NavLink to="/admin/reviews" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <FiShield size={15} /> Manage Reviews
            </NavLink>
            <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <FiSettings size={15} /> Admin Panel
            </NavLink>
          </NavSection>
        )}

        <NavSection title="Reviews">
          <NavLink to="/reviews" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <FiStar size={15} /> View Reviews
          </NavLink>
          {!isFaculty && (
            <NavLink to="/reviews/submit" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <FiMessageSquare size={15} /> Submit Review
            </NavLink>
          )}
        </NavSection>

        <NavSection title="Reports">
          <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <FiBarChart2 size={15} /> Performance Reports
          </NavLink>
        </NavSection>

      </nav>

      <div style={{ padding: '10px 8px', borderTop: '1px solid var(--border)' }}>
        <button onClick={handleLogout} className="nav-item"
          style={{ width: '100%', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', borderLeft: 'none', textAlign: 'left' }}>
          <FiLogOut size={15} /> Sign Out
        </button>
        <div style={{ fontSize: '.6rem', color: 'var(--text3)', padding: '4px 14px 0' }}>
          Faculty Evaluation System v1.0
        </div>
      </div>
    </aside>
  );
}