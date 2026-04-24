import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import FacultyDirectory from './pages/FacultyDirectory';
import FacultyForm from './pages/FacultyForm';
import FacultyMyProfile from './pages/FacultyMyProfile';
import StudentProfile from './pages/Studentprofile';
import AdminProfile from './pages/Adminprofile';
import PhotoUpload from './pages/PhotoUpload';
import SearchFaculty from './pages/SearchFaculty';
import ReviewsPage from './pages/ReviewsPage';
import SubmitReview from './pages/SubmitReview';
import AdminReviews from './pages/AdminReviews';
import ReportsPage from './pages/ReportsPage';
import AdminDashboard from './pages/AdminDashboard';
import './index.css';

const toastStyle = {
  style: { background: '#1e2535', color: '#e8ecf4', border: '1px solid #2a3347', fontFamily: 'system-ui,sans-serif', fontSize: '.875rem' }
};

function AppLayout() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/faculty" element={<FacultyDirectory />} />
          <Route path="/faculty/new" element={<FacultyForm />} />
          <Route path="/faculty/create-my-profile" element={<FacultyMyProfile />} />
          <Route path="/faculty/search" element={<SearchFaculty />} />
          <Route path="/faculty/:id" element={<FacultyForm />} />
          <Route path="/faculty/:id/photo" element={<PhotoUpload />} />
          <Route path="/my-profile" element={<StudentProfile />} />
          <Route path="/admin-profile" element={<AdminProfile />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/reviews/submit" element={<SubmitReview />} />
          <Route path="/admin/reviews" element={<AdminReviews />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text2)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 14 }}>🎓</div>
          <div>Loading FacultyHub...</div>
        </div>
      </div>
    );
  }
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to="/" replace /> : <SignupPage />} />
      <Route path="/*" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={toastStyle} />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}