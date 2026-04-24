import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFacultyById, uploadFacultyPhoto } from '../utils/api';
import toast from 'react-hot-toast';

export default function PhotoUpload() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef();
  const [faculty, setFaculty] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    getFacultyById(id)
      .then(r => setFaculty(r.data.data))
      .catch(() => { toast.error('Faculty not found'); navigate('/faculty'); });
  }, [id]);

  const handleFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) { toast.error('Only image files allowed'); return; }
    if (f.size > 5 * 1024 * 1024) { toast.error('File too large. Max 5MB'); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) { toast.error('Please select a photo first'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      await uploadFacultyPhoto(id, fd);
      toast.success('Profile photo uploaded successfully!');
      navigate('/faculty');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const currentPhoto = faculty?.profilePhoto ? `http://127.0.0.1:5000/uploads/${faculty.profilePhoto}` : null;
  const ini = faculty?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Upload <span>Profile Photo</span></h1>
        <button className="btn btn-secondary" onClick={() => navigate('/faculty')}>← Back</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 760 }}>
        {/* Left - faculty info */}
        <div className="card">
          <div style={{ fontSize: '.75rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, fontWeight: 600 }}>Faculty Member</div>
          {faculty && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              {currentPhoto ? (
                <img src={currentPhoto} alt={faculty.name}
                  style={{ width: 70, height: 70, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)' }} />
              ) : (
                <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'rgba(79,142,247,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.4rem', color: 'var(--accent)', border: '3px solid var(--border)' }}>
                  {ini}
                </div>
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{faculty.name}</div>
                <div style={{ fontSize: '.8rem', color: 'var(--text2)' }}>{faculty.designation || 'Faculty'}</div>
                <div style={{ fontSize: '.78rem', color: 'var(--text3)' }}>{faculty.department}</div>
              </div>
            </div>
          )}
          <div style={{ fontSize: '.8rem', color: 'var(--text2)', lineHeight: 2 }}>
            <div>✅ Accepted: JPG, PNG, WebP, GIF</div>
            <div>📏 Max size: 5MB</div>
            <div>🖼 Recommended: Square image, min 200×200px</div>
          </div>
          {currentPhoto && (
            <div style={{ marginTop: 14, padding: '10px 12px', background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.2)', borderRadius: 7, fontSize: '.78rem', color: 'var(--success)' }}>
              ✓ Current photo exists. Uploading a new one will replace it.
            </div>
          )}
        </div>

        {/* Right - upload */}
        <div className="card">
          <div style={{ fontSize: '.75rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, fontWeight: 600 }}>Upload New Photo</div>

          {/* Drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            style={{
              border: `2px dashed ${dragging ? 'var(--accent)' : preview ? 'var(--success)' : 'var(--border)'}`,
              borderRadius: 10, padding: 24, textAlign: 'center', cursor: 'pointer',
              background: dragging ? 'rgba(79,142,247,.05)' : 'var(--surface2)',
              transition: 'all .2s', marginBottom: 14,
            }}>
            {preview ? (
              <img src={preview} alt="Preview"
                style={{ maxHeight: 160, maxWidth: '100%', borderRadius: 8, objectFit: 'contain' }} />
            ) : (
              <>
                <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📷</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Drop photo here or click to browse</div>
                <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>JPG, PNG, WebP up to 5MB</div>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />

          {file && (
            <div style={{ fontSize: '.78rem', color: 'var(--text2)', marginBottom: 10, padding: '7px 10px', background: 'var(--surface2)', borderRadius: 6 }}>
              📎 {file.name} ({(file.size / 1024).toFixed(0)} KB)
              <button onClick={() => { setFile(null); setPreview(null); }}
                style={{ float: 'right', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '.8rem' }}>✕ Remove</button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleUpload} disabled={!file || loading}>
              {loading ? 'Uploading...' : '⬆️ Upload Photo'}
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/faculty')}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}