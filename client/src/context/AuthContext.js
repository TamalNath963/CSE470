import { createContext, useContext, useState, useEffect } from 'react';
import API from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('fh_token');
    const saved = localStorage.getItem('fh_user');
    if (token && saved) {
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Set saved user first so UI loads fast
      setUser(JSON.parse(saved));
      // Then fetch fresh data from DB to get latest profilePhoto
      API.get('/auth/me')
        .then(res => {
          const fresh = res.data.data;
          const freshUser = {
            id: fresh._id,
            name: fresh.name,
            email: fresh.email,
            role: fresh.role,
            department: fresh.department,
            profilePhoto: fresh.profilePhoto || '',
          };
          setUser(freshUser);
          localStorage.setItem('fh_user', JSON.stringify(freshUser));
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('fh_token', token);
    localStorage.setItem('fh_user', JSON.stringify(userData));
    API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('fh_token');
    localStorage.removeItem('fh_user');
    delete API.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user, login, logout, loading,
      isAdmin: user?.role === 'admin',
      isFaculty: user?.role === 'faculty',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);