import { useEffect, useState } from 'react';
import { getAllReviewsAdmin, updateReviewStatus, deleteReview } from '../utils/api';
import { StarDisplay } from '../components/StarRating';
import toast from 'react-hot-toast';

const statusColors = {
  Pending: 'badge-on-leave',
  Approved: 'badge-active',
  Rejected: 'badge-retired',
};

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState('Pending');
  const [loading, setLoading] = useState(true);
  const [noteModal, setNoteModal] = useState(null); // { reviewId, action }
  const [adminNote, setAdminNote] = useState('');

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await getAllReviewsAdmin({ status: filter || undefined });
      setReviews(res.data.data);
    } catch { toast.error('Failed to load reviews'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReviews(); }, [filter]);

  const handleAction = async (id, status, note = '') => {
    try {
      await updateReviewStatus(id, { status, adminNote: note });
      toast.success(`Review ${status}`);
      setNoteModal(null);
      setAdminNote('');
      fetchReviews();
    } catch { toast.error('Action failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this review?')) return;
    await deleteReview(id);
    toast.success('Review deleted');
    fetchReviews();
  };

  const counts = { Pending: 0, Approved: 0, Rejected: 0 };
  reviews.forEach(r => { /* we fetch filtered, so this won't be accurate */ });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Admin <span>Review Panel</span></h1>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['', 'Pending', 'Approved', 'Rejected'].map(s => (
          <button
            key={s}
            className={`btn ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(s)}
          >
            {s || 'All'} Reviews
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="empty-state">
          <h3>No {filter || ''} reviews found</h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {reviews.map(review => (
            <div key={review._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700 }}>
                      {review.faculty?.name || 'Unknown Faculty'}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>
                      {review.faculty?.department}
                    </span>
                    <span className={`badge ${statusColors[review.status]}`}>{review.status}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>
                    By: {review.reviewerLabel} ·{' '}
                    {review.subject && <>{review.subject} · </>}
                    {review.semester && <>{review.semester} · </>}
                    {new Date(review.createdAt).toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <StarDisplay rating={review.rating} size={15} />
                  <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 2 }}>{review.rating}/5</div>
                </div>
              </div>

              <p style={{ margin: '12px 0', fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text)' }}>
                {review.reviewText}
              </p>

              {review.adminNote && (
                <div style={{
                  background: 'var(--surface2)', borderRadius: 6, padding: '8px 12px',
                  fontSize: '0.78rem', color: 'var(--text2)', marginBottom: 10, borderLeft: '3px solid var(--accent)'
                }}>
                  <strong>Admin note:</strong> {review.adminNote}
                </div>
              )}

              {/* Feature 4: Action buttons */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {review.status !== 'Approved' && (
                  <button className="btn btn-success btn-sm"
                    onClick={() => setNoteModal({ reviewId: review._id, action: 'Approved' })}>
                    ✅ Approve
                  </button>
                )}
                {review.status !== 'Rejected' && (
                  <button className="btn btn-danger btn-sm"
                    onClick={() => setNoteModal({ reviewId: review._id, action: 'Rejected' })}>
                    ❌ Reject
                  </button>
                )}
                {review.status !== 'Pending' && (
                  <button className="btn btn-secondary btn-sm"
                    onClick={() => handleAction(review._id, 'Pending')}>
                    ↩ Reset to Pending
                  </button>
                )}
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(review._id)}>
                  🗑 Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admin note modal */}
      {noteModal && (
        <div className="modal-overlay" onClick={() => setNoteModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">
                {noteModal.action === 'Approved' ? '✅ Approve' : '❌ Reject'} Review
              </span>
              <button className="modal-close" onClick={() => setNoteModal(null)}>✕</button>
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label>Admin Note (Optional)</label>
              <textarea
                rows={3}
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                placeholder="Add a note about your decision..."
                style={{ resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className={`btn ${noteModal.action === 'Approved' ? 'btn-success' : 'btn-danger'}`}
                onClick={() => handleAction(noteModal.reviewId, noteModal.action, adminNote)}
              >
                Confirm {noteModal.action}
              </button>
              <button className="btn btn-secondary" onClick={() => setNoteModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}