import { MapPin, Navigation } from 'lucide-react';
import { useRef } from 'react';

const TAG_DETAILS = {
  'Jain': { icon: '🍃', label: 'Jain (No Onion/Garlic)', color: '#E8F5E9', text: '#2E7D32' },
  'Sweet Prasad': { icon: '🍬', label: 'Sweet Prasad', color: '#FFF3E0', text: '#E65100' },
  'Full Meal': { icon: '🍛', label: 'Full Meal', color: '#E0F7FA', text: '#006064' },
  'Drinking Water': { icon: '💧', label: 'Drinking Water', color: '#E3F2FD', text: '#0D47A1' },
  'Snacks': { icon: '🍪', label: 'Snacks', color: '#F3E5F5', text: '#4A148C' }
};

const FOOD_EMOJIS = {
  'Langar': '🕌',
  'Bhandara': '🍛',
  'Prasad': '🙏',
  'Iftar': '🌙',
  'Other': '🤲'
};

export default function SevaCard({ seva, onClick }) {
  const cardRef = useRef(null);
  const isFinished = seva.status === 'finished' || !seva.isLive;
  const isLow = seva.status === 'low';
  const isSOS = seva.isSOS && !isFinished;

  // 3D tilt on mouse move
  const handleMouseMove = (e) => {
    if (isFinished) return;
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotateX = ((y - cy) / cy) * -6;
    const rotateY = ((x - cx) / cx) * 6;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
    }
  };

  const accentClass = isFinished ? 'card-accent-gray'
    : isSOS ? 'card-accent-red'
    : isLow ? 'card-accent-orange'
    : seva.permanence === 'permanent' ? 'card-accent-purple'
    : 'card-accent-green';

  const trustScore = seva.trustScore ?? 100;

  return (
    <div
      ref={cardRef}
      className={`card-3d ${accentClass}`}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ padding: '1.25rem', marginBottom: '0', filter: isFinished ? 'grayscale(20%)' : 'none' }}
    >
      {/* Top row: avatar + title + status */}
      <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        {/* Food type avatar */}
        <div style={{
          width: '44px', height: '44px', flexShrink: 0,
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(255,153,51,0.12) 0%, rgba(255,153,51,0.06) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem',
          boxShadow: '0 2px 8px rgba(255,153,51,0.15)'
        }}>
          {FOOD_EMOJIS[seva.type] || '🤲'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontSize: '1.05rem', margin: '0 0 0.3rem 0',
            textDecoration: isFinished ? 'line-through' : 'none',
            color: 'var(--color-text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {seva.title}
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            🍲 {seva.food}
          </p>
        </div>

        {/* Status badge */}
        <div style={{ flexShrink: 0 }}>
          {isSOS ? (
            <span className="sos-pulse-badge">🚨 SOS</span>
          ) : isFinished ? (
            <span className="status-pill finished">Ended</span>
          ) : isLow ? (
            <span className="status-pill low">⚠️ Low</span>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'var(--color-success-bg)', color: 'var(--color-success)', padding: '0.2rem 0.6rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: 700 }}>
              <span className="live-dot" />Live
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      {((seva.tags && seva.tags.length > 0) || seva.permanence === 'permanent' || seva.isMoving) && (
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.875rem' }}>
          {seva.permanence === 'permanent' && (
            <span className="seva-tag-badge" style={{ backgroundColor: '#EDE9FE', color: '#6D28D9' }}>🏢 Permanent</span>
          )}
          {seva.isMoving && (
            <span className="seva-tag-badge" style={{ backgroundColor: '#FFFBEB', color: '#D97706' }}>🚚 Traveling</span>
          )}
          {seva.tags && seva.tags.map(t => {
            const d = TAG_DETAILS[t] || { icon: '🏷️', color: '#F1F5F9', text: '#64748B' };
            return (
              <span key={t} className="seva-tag-badge" style={{ backgroundColor: d.color, color: d.text }}>
                {d.icon} {t}
              </span>
            );
          })}
        </div>
      )}

      {/* Footer: distance + navigate + trust bar */}
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '0.875rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
            <MapPin size={14} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontWeight: 600 }}>{seva.distance || '—'}</span>
          </div>
          <button
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.875rem', fontSize: '0.8rem', gap: '0.3rem' }}
            onClick={(e) => {
              e.stopPropagation();
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${seva.location.lat},${seva.location.lng}`, '_blank');
            }}
            disabled={isFinished}
          >
            <Navigation size={13} style={{ color: 'var(--color-primary)' }} /> Navigate
          </button>
        </div>

        {/* Trust score bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="trust-bar-track" style={{ flex: 1 }}>
            <div className="trust-bar-fill" style={{ width: `${trustScore}%` }} />
          </div>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', minWidth: '32px', textAlign: 'right' }}>
            {trustScore}%
          </span>
        </div>
      </div>
    </div>
  );
}
