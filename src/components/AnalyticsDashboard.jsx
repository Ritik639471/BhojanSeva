import { useState, useEffect } from 'react';
import { getAnalytics } from '../services/SevaService';
import StatCounter from './StatCounter';

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics().then(data => { setAnalytics(data); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-secondary)' }}>
      <div style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'pulse-dot 1.8s infinite' }}>📊</div>
      Loading analytics...
    </div>
  );

  const a = analytics || {};

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>📊 Impact Dashboard</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}>BhojanSeva's real-world impact on food security and hunger relief.</p>
      </div>

      {/* Hero stat */}
      <div style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)', borderRadius: 'var(--radius-xl)', padding: '2.5rem', color: 'white', textAlign: 'center', marginBottom: '2rem', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.08em', opacity: 0.85, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Total Meals Tracked</div>
        <div style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1 }}>
          <StatCounter target={String(a.totalMeals || 0)} />
        </div>
        <div style={{ marginTop: '0.75rem', opacity: 0.85, fontSize: '0.95rem' }}>Across {a.citiesCovered || 0} cities in India</div>
      </div>

      {/* Impact grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
        {[
          { icon: '🍛', num: String(a.totalSevas || 0), label: 'Seva Camps Listed', color: '#8B5CF6' },
          { icon: '👥', num: String(a.totalGoings || 0), label: 'Community Going Taps', color: 'var(--color-success)' },
          { icon: '🔥', num: String(a.mealsToday || 0), label: 'Meals Today', color: 'var(--color-primary)' },
          { icon: '🌱', num: `${a.wasteKgSaved || 0}`, suffix: 'kg', label: 'Food Waste Saved', color: '#06B6D4' },
          { icon: '🌍', num: String(a.co2Saved || '0'), suffix: 't', label: 'CO₂ Equivalent Saved', color: '#10B981' },
          { icon: '🏙️', num: String(a.activeNow || 0), label: 'Active Right Now', color: '#F59E0B' },
        ].map(({ icon, num, suffix, label, color }) => (
          <div key={label} style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', textAlign: 'center', borderBottom: `3px solid ${color}` }}>
            <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{icon}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color, lineHeight: 1 }}>
              <StatCounter target={num} suffix={suffix || ''} />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, marginTop: '0.35rem' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Food Waste visual */}
      <div style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '0.5rem', fontSize: '1.15rem' }}>🌱 Environmental Impact</h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          Every meal served prevents food waste. {a.wasteKgSaved?.toLocaleString() || 0} kg saved ≈ {a.co2Saved || 0} tonnes CO₂ not emitted.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', minWidth: '80px' }}>Meals Impact</span>
          <div style={{ flex: 1, height: '12px', background: '#E2E8F0', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, ((a.totalMeals || 0) / 200000) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-success), #059669)', borderRadius: '6px', transition: 'width 1s ease' }} />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', minWidth: '60px', textAlign: 'right' }}>Goal: 200k</span>
        </div>
      </div>

      {/* How data is collected */}
      <div style={{ background: 'rgba(255,153,51,0.04)', border: '1px solid rgba(255,153,51,0.15)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
        <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>ℹ️ About This Data</h4>
        <p style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
          All metrics are derived from community-submitted data. Meal counts are based on organizer-reported estimated servings. CO₂ calculations use WRAP (UK) food waste emission factors of 2.5kg CO₂e per kg food waste prevented.
        </p>
      </div>
    </div>
  );
}
