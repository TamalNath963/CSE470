import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAllFaculty } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { StarInput } from '../components/StarRating';
import API from '../utils/api';
import toast from 'react-hot-toast';

export default function SubmitReview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [facultyList, setFacultyList] = useState([]);
  const [loadingFaculty, setLoadingFaculty] = useState(true);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [form, setForm] = useState({
    faculty: searchParams.get('faculty') || '',
    rating: 0,
    reviewText: '',
    teachingQuality: 0,
    subjectKnowledge: 0,
    communication: 0,
    availability: 0,
    semester: '',
    subject: '',
  });

  useEffect(() => {
    getAllFaculty()
      .then(r => {
        const list = r?.data?.data;
        if (Array.isArray(list)) setFacultyList(list);
      })
      .catch(() => toast.error('Could not load faculty list'))
      .finally(() => setLoadingFaculty(false));
  }, []);

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const resetForm = () => {
    setForm({ faculty: '', rating: 0, reviewText: '', teachingQuality: 0, subjectKnowledge: 0, communication: 0, availability: 0, semester: '', subject: '' });
    setIsAnonymous(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.faculty) { toast.error('Please select a faculty member'); return; }
    if (form.rating === 0) { toast.error('Please give an overall rating'); return; }
    if (form.reviewText.trim().length < 10) { toast.error('Review must be at least 10 characters'); return; }

    setLoading(true);
    try {
      const payload = {
        faculty: form.faculty,
        rating: Number(form.rating),
        reviewText: form.reviewText.trim(),
        reviewerLabel: isAnonymous ? 'Anonymous Student' : user?.name,
        teachingQuality: form.teachingQuality > 0 ? Number(form.teachingQuality) : null,
        subjectKnowledge: form.subjectKnowledge > 0 ? Number(form.subjectKnowledge) : null,
        communication: form.communication > 0 ? Number(form.communication) : null,
        availability: form.availability > 0 ? Number(form.availability) : null,
        semester: form.semester,
        subject: form.subject,
      };

      await API.post('/reviews', payload);
      setSubmitted(true);
      toast.success('Review submitted! Pending admin approval.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ maxWidth: 520, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: 20 }}>✅</div>
        <h2 style={{ marginBottom: 10 }}>Review Submitted!</h2>
        <p style={{ color: 'var(--text2)', marginBottom: 28 }}>
          Your review is pending admin approval and will appear once approved. Thank you for your feedback!
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => { setSubmitted(false); resetForm(); }}>Submit Another</button>
          <button className="btn btn-secondary" onClick={() => navigate('/reviews')}>View Reviews</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Submit <span>Review</span></h1>
        <button className="btn btn-secondary" onClick={() => navigate('/reviews')}>← Back</button>
      </div>

      <div className="card" style={{ maxWidth: 680 }}>
        <form onSubmit={handleSubmit}>

          {/* Faculty selection */}
          <div className="form-group" style={{ marginBottom: 18 }}>
            <label>Select Faculty *</label>
            {loadingFaculty ? (
              <div style={{ padding: '10px 14px', background: 'var(--surface2)', borderRadius: 8, fontSize: '.85rem', color: 'var(--text3)' }}>
                Loading faculty...
              </div>
            ) : facultyList.length === 0 ? (
              <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8, fontSize: '.85rem', color: 'var(--danger)' }}>
                No faculty found. Please contact admin.
              </div>
            ) : (
              <select value={form.faculty} onChange={e => setField('faculty', e.target.value)} required>
                <option value="">-- Choose a Faculty Member --</option>
                {facultyList.map(f => (
                  <option key={f._id} value={f._id}>
                    {f.name} — {f.department}{f.designation ? ` (${f.designation})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Subject & Semester */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Subject *</label>
              <input value={form.subject} onChange={e => setField('subject', e.target.value)} placeholder="e.g. Data Structures" required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Semester *</label>
              <input value={form.semester} onChange={e => setField('semester', e.target.value)} placeholder="e.g. Spring 2025" required />
            </div>
          </div>

          {/* Overall rating */}
          <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '16px 18px', marginBottom: 16 }}>
            <StarInput label="Overall Rating *" value={form.rating} onChange={val => setField('rating', val)} />
          </div>

          {/* Detailed ratings */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 10 }}>
              Detailed Ratings (Optional)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { key: 'teachingQuality', label: 'Teaching Quality' },
                { key: 'subjectKnowledge', label: 'Subject Knowledge' },
                { key: 'communication', label: 'Communication' },
                { key: 'availability', label: 'Availability' },
              ].map(({ key, label }) => (
                <div key={key} style={{ padding: '12px 14px', background: 'var(--surface2)', borderRadius: 8 }}>
                  <div style={{ fontSize: '.74rem', fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>{label}</div>
                  <StarInput value={form[key]} onChange={val => setField(key, val)} />
                </div>
              ))}
            </div>
          </div>

          {/* Review text */}
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label>Your Review * (min 10 characters)</label>
            <textarea
              rows={4}
              value={form.reviewText}
              onChange={e => setField('reviewText', e.target.value)}
              placeholder="Share your experience with this faculty member. Describe their teaching style, communication, helpfulness..."
              required
              minLength={10}
              maxLength={1000}
              style={{ resize: 'vertical' }}
            />
            <div style={{ fontSize: '.7rem', color: 'var(--text3)', textAlign: 'right', marginTop: 4 }}>
              {form.reviewText.length}/1000
            </div>
          </div>

          {/* Identity — 2 options only, no editing */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 10 }}>
              Review Identity
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {/* Use real name */}
              <div
                onClick={() => setIsAnonymous(false)}
                style={{
                  padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                  border: `2px solid ${!isAnonymous ? 'var(--accent)' : 'var(--border)'}`,
                  background: !isAnonymous ? 'rgba(79,142,247,0.08)' : 'var(--surface2)',
                  transition: 'all .15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${!isAnonymous ? 'var(--accent)' : 'var(--text3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {!isAnonymous && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '.85rem', color: !isAnonymous ? 'var(--accent)' : 'var(--text)' }}>My Name</span>
                </div>
                <div style={{ fontSize: '.78rem', color: 'var(--text2)', paddingLeft: 24 }}>
                  Show as: <strong style={{ color: 'var(--text)' }}>{user?.name}</strong>
                </div>
              </div>

              {/* Anonymous */}
              <div
                onClick={() => setIsAnonymous(true)}
                style={{
                  padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                  border: `2px solid ${isAnonymous ? 'var(--accent)' : 'var(--border)'}`,
                  background: isAnonymous ? 'rgba(79,142,247,0.08)' : 'var(--surface2)',
                  transition: 'all .15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${isAnonymous ? 'var(--accent)' : 'var(--text3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {isAnonymous && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '.85rem', color: isAnonymous ? 'var(--accent)' : 'var(--text)' }}>Anonymous</span>
                </div>
                <div style={{ fontSize: '.78rem', color: 'var(--text2)', paddingLeft: 24 }}>
                  Show as: <strong style={{ color: 'var(--text)' }}>Anonymous Student</strong>
                </div>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            disabled={loading || loadingFaculty}>
            {loading ? 'Submitting...' : '📝 Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
}