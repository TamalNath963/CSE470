import axios from 'axios';

const API = axios.create({
  baseURL: 'http://127.0.0.1:5000/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('fh_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth APIs
export const loginUser = (data) => API.post('/auth/login', data);
export const registerUser = (data) => API.post('/auth/register', data);
export const getMe = () => API.get('/auth/me');
export const updateProfile = (data) => API.put('/auth/update-profile', data);
export const changePassword = (data) => API.put('/auth/change-password', data);
export const getAllUsers = () => API.get('/auth/users');
export const toggleUserActive = (id) => API.patch(`/auth/users/${id}/toggle`);

// Faculty APIs
export const createFaculty = (data) => API.post('/faculty', data);
export const getAllFaculty = (params) => API.get('/faculty', { params });
export const getFacultyById = (id) => API.get(`/faculty/${id}`);
export const updateFaculty = (id, data) => API.put(`/faculty/${id}`, data);
export const updateFacultyStatus = (id, status) => API.patch(`/faculty/${id}/status`, { status });
export const uploadFacultyPhoto = (id, formData) =>
  API.post(`/faculty/${id}/photo`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteFaculty = (id) => API.delete(`/faculty/${id}`);

// Review APIs
export const submitReview = (data) => API.post('/reviews', data);
export const getReviewsByFaculty = (facultyId, params) => API.get(`/reviews/faculty/${facultyId}`, { params });
export const getAllReviewsAdmin = (params) => API.get('/reviews/admin/all', { params });
export const updateReviewStatus = (id, data) => API.patch(`/reviews/${id}/status`, data);
export const getFacultyReviewStats = (facultyId) => API.get(`/reviews/stats/${facultyId}`);
export const deleteReview = (id) => API.delete(`/reviews/${id}`);

// Course APIs
// export const createCourse = (data) => API.post('/courses', data);
// export const getAllCourses = (params) => API.get('/courses', { params });
// export const getCourseById = (id) => API.get(`/courses/${id}`);
// export const updateCourse = (id, data) => API.put(`/courses/${id}`, data);
// export const assignFacultyToCourse = (id, facultyId) => API.post(`/courses/${id}/assign`, { facultyId });
// export const removeFacultyFromCourse = (id, facultyId) => API.delete(`/courses/${id}/assign/${facultyId}`);
// export const updateCourseStatus = (id, data) => API.patch(`/courses/${id}/status`, data);
// export const deleteCourse = (id) => API.delete(`/courses/${id}`);

// Report APIs
export const generateReport = (data) => API.post('/reports/generate', data);
export const getAllReports = (params) => API.get('/reports', { params });
export const getReportById = (id) => API.get(`/reports/${id}`);
export const updateReportRemarks = (id, data) => API.patch(`/reports/${id}/remarks`, data);
export const getReportAnalytics = (params) => API.get('/reports/analytics/summary', { params });
export const deleteReport = (id) => API.delete(`/reports/${id}`);

// Admin APIs
export const getAdminStats = () => API.get('/admin/stats');
export const getTopFaculty = () => API.get('/admin/top-faculty');
export const getActivityLog = () => API.get('/admin/activity');
export const getSystemSettings = () => API.get('/admin/settings');
export const updateSystemSettings = (data) => API.put('/admin/settings', data);
export const createAnnouncement = (data) => API.post('/admin/announcements', data);
export const getAllAnnouncements = (params) => API.get('/admin/announcements', { params });
export const updateAnnouncement = (id, data) => API.put(`/admin/announcements/${id}`, data);
export const deleteAnnouncement = (id) => API.delete(`/admin/announcements/${id}`);

export default API;