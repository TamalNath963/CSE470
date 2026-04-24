import { useEffect, useState, useMemo } from 'react';
import { getAllFaculty, getReviewsByFaculty } from '../utils/api';
import { StarDisplay } from '../components/StarRating';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function RatingBar({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.8rem' }}>
        <span style={{ color: 'var(--text2)' }}>{label}</span>
        <span style={{ fontWeight: 600 }}>{value}/5</span>
      </div>
      <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 3 }}>
        <div style={{
          height: '100%', width: `${(value / 5) * 100}%`,
          background: 'linear-gradient(90deg, var(--accent), var(--accent2))',
          borderRadius: 3, transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  const navigate = useNavigate();
  const { isFaculty } = useAuth();
  const [facultyList, setFacultyList] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [reviewData, setReviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterSubject, setFilterSubject] = useState('');
  const [filterSemester, setFilterSemester] = useState('');

  useEffect(() => {
    getAllFaculty().then(r => setFacultyList(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedFaculty) { setReviewData(null); return; }
    setLoading(true);
    setFilterSubject('');
    setFilterSemester('');
    getReviewsByFaculty(selectedFaculty)
      .then(r => setReviewData(r.data))
      .catch(() => toast.error('Failed to load reviews'))
      .finally(() => setLoading(false));
  }, [selectedFaculty]);

  const faculty = facultyList.find(f => f._id === selectedFaculty);

  // Get unique subjects and semesters from reviews for filter dropdowns
  const allReviews = reviewData?.data || [];
  const uniqueSubjects = [...new Set(allReviews.map(r => r.subject).filter(Boolean))];
  const uniqueSemesters = [...new Set(allReviews.map(r => r.semester).filter(Boolean))];

  // Apply filters client-side
  const filteredReviews = useMemo(() => {
    return allReviews.filter(r => {
      const matchSubject = !filterSubject || r.subject === filterSubject;
      const matchSemester = !filterSemester || r.semester === filterSemester;
      return matchSubject && matchSemester;
    });
  }, [allReviews, filterSubject, filterSemester]);

  const hasFilters = filterSubject || filterSemester;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Faculty <span>Reviews</span></h1>
        {!isFaculty && (
          <button className="btn btn-primary" onClick={() => navigate(`/reviews/submit${selectedFaculty ? `?faculty=${selectedFaculty}` : ''}`)}>
            + Write Review
          </button>
        )}
      </div>

      <div className="form-group" style={{ marginBottom: 24, maxWidth: 400 }}>
        <label>Select Faculty to View Reviews</label>
        <select value={selectedFaculty} onChange={e => setSelectedFaculty(e.target.value)}>
          <option value="">-- Choose Faculty --</option>
          {facultyList.map(f => (
            <option key={f._id} value={f._id}>{f.name} — {f.department}</option>
          ))}
        </select>
      </div>

      {loading && <div className="loading">Loading reviews...</div>}

      {reviewData && faculty && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text2)', marginBottom: 8 }}>Overall Rating</div>
              {reviewData.stats ? (
                <>
                  <div style={{ fontSize: '3.5rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>
                    {reviewData.stats.avgRating}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <StarDisplay rating={reviewData.stats.avgRating} size={22} />
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text3)', marginTop: 6 }}>
                    Based on {reviewData.stats.totalReviews} approved review{reviewData.stats.totalReviews !== 1 ? 's' : ''}
                  </div>
                </>
              ) : (
                <div style={{ color: 'var(--text3)', fontSize: '0.875rem' }}>No approved reviews yet</div>
              )}
            </div>

            <div className="card">
              <div style={{ fontSize: '0.875rem', color: 'var(--text2)', marginBottom: 14 }}>Detailed Ratings</div>
              {reviewData.stats ? (
                <>
                  <RatingBar label="Teaching Quality" value={reviewData.stats.avgTeaching} />
                  <RatingBar label="Subject Knowledge" value={reviewData.stats.avgKnowledge} />
                  <RatingBar label="Communication" value={reviewData.stats.avgCommunication} />
                  <RatingBar label="Availability" value={reviewData.stats.avgAvailability} />
                </>
              ) : (
                <div style={{ color: 'var(--text3)', fontSize: '0.875rem' }}>No data available</div>
              )}
            </div>
          </div>

          {reviewData.stats && (
            <div className="card" style={{ marginBottom: 24 }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text2)', marginBottom: 14 }}>Rating Distribution</div>
              {[5, 4, 3, 2, 1].map(star => {
                const count = reviewData.distribution?.[star] || 0;
                const pct = reviewData.stats.totalReviews > 0
                  ? Math.round((count / reviewData.stats.totalReviews) * 100) : 0;
                return (
                  <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <div style={{ width: 60, fontSize: '0.8rem', color: '#f59e0b', flexShrink: 0 }}>{'★'.repeat(star)}</div>
                    <div style={{ flex: 1, height: 8, background: 'var(--surface2)', borderRadius: 4 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#f59e0b', borderRadius: 4, transition: 'width 0.5s' }} />
                    </div>
                    <div style={{ width: 40, fontSize: '0.78rem', color: 'var(--text3)', textAlign: 'right' }}>{count}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Filter bar — only show if reviews exist */}
          {allReviews.length > 0 && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ fontSize: '.88rem', fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: .5 }}>
                Filter:
              </div>
              <select
                value={filterSubject}
                onChange={e => setFilterSubject(e.target.value)}
                style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: '.92rem', cursor: 'pointer' }}
              >
                <option value="">All Subjects</option>
                {uniqueSubjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={filterSemester}
                onChange={e => setFilterSemester(e.target.value)}
                style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: '.92rem', cursor: 'pointer' }}
              >
                <option value="">All Semesters</option>
                {uniqueSemesters.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {hasFilters && (
                <button
                  onClick={() => { setFilterSubject(''); setFilterSemester(''); }}
                  style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--danger)', fontSize: '.82rem', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  ✕ Clear Filters
                </button>
              )}
              <span style={{ fontSize: '.88rem', color: 'var(--text3)', marginLeft: 'auto' }}>
                {filteredReviews.length} of {allReviews.length} review{allReviews.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          <h3 style={{ marginBottom: 16 }}>
            {filteredReviews.length} Review{filteredReviews.length !== 1 ? 's' : ''}
            {hasFilters && <span style={{ fontSize: '.75rem', color: 'var(--text3)', fontWeight: 400, marginLeft: 8 }}>(filtered)</span>}
          </h3>

          {filteredReviews.length === 0 ? (
            <div className="empty-state">
              {hasFilters ? (
                <>
                  <h3>No reviews match your filters</h3>
                  <p>Try clearing the subject or semester filter.</p>
                  <button className="btn btn-secondary" style={{ marginTop: 14 }}
                    onClick={() => { setFilterSubject(''); setFilterSemester(''); }}>
                    Clear Filters
                  </button>
                </>
              ) : (
                <>
                  <h3>No approved reviews yet</h3>
                  {!isFaculty && (
                    <>
                      <p>Be the first to review this faculty member.</p>
                      <button className="btn btn-primary" style={{ marginTop: 14 }}
                        onClick={() => navigate(`/reviews/submit?faculty=${selectedFaculty}`)}>
                        Write a Review
                      </button>
                    </>
                  )}
                  {isFaculty && <p>No students have reviewed you yet.</p>}
                </>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {filteredReviews.map(review => (
                <div key={review._id} className="card" style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{review.reviewerLabel}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 2 }}>
                        {review.subject && <span style={{ background: 'rgba(79,142,247,0.1)', color: 'var(--accent)', padding: '1px 6px', borderRadius: 4, marginRight: 6 }}>{review.subject}</span>}
                        {review.semester && <span style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa', padding: '1px 6px', borderRadius: 4, marginRight: 6 }}>{review.semester}</span>}
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <StarDisplay rating={review.rating} size={16} />
                      <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 2 }}>{review.rating}/5</div>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.6, marginBottom: 10 }}>
                    {review.reviewText}
                  </p>

                  {(review.teachingQuality || review.subjectKnowledge || review.communication || review.availability) && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {review.teachingQuality && <span className="tag">Teaching: {review.teachingQuality}★</span>}
                      {review.subjectKnowledge && <span className="tag">Knowledge: {review.subjectKnowledge}★</span>}
                      {review.communication && <span className="tag">Communication: {review.communication}★</span>}
                      {review.availability && <span className="tag">Availability: {review.availability}★</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!selectedFaculty && !loading && (
        <div className="empty-state">
          <h3>Select a faculty member above</h3>
          <p>Choose a faculty member to view their reviews and ratings.</p>
        </div>
      )}
    </div>
  );
}