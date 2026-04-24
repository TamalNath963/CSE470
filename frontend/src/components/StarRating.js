import { useState } from 'react';

export function StarDisplay({ rating, size = 16, color = '#f59e0b' }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span key={i} style={{ color: i <= Math.round(rating) ? color : 'var(--border)', fontSize: size }}>
        ★
      </span>
    );
  }
  return <span style={{ letterSpacing: 1 }}>{stars}</span>;
}

export function StarInput({ value, onChange, label = '' }) {
  const [hover, setHover] = useState(0);

  return (
    <div>
      {label && <label style={{ display: 'block', marginBottom: 6 }}>{label}</label>}
      <div style={{ display: 'flex', gap: 4 }}>
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            style={{
              fontSize: 28,
              cursor: 'pointer',
              color: star <= (hover || value) ? '#f59e0b' : 'var(--border)',
              transition: 'color 0.1s, transform 0.1s',
              transform: star <= (hover || value) ? 'scale(1.15)' : 'scale(1)',
              display: 'inline-block',
            }}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(star)}
          >
            ★
          </span>
        ))}
        {value > 0 && (
          <span style={{ marginLeft: 8, color: 'var(--text2)', fontSize: '0.85rem', alignSelf: 'center' }}>
            {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][value]}
          </span>
        )}
      </div>
    </div>
  );
}