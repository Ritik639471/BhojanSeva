import { useState, useEffect } from 'react';
import { getLeaderboard } from '../services/SevaService';
import { useApp } from '../context/AppContext';

const CITIES = ['All Cities', 'Delhi', 'Mumbai', 'Kolkata', 'Amritsar', 'Jaipur', 'Varanasi'];

export default function Leaderboard() {
  const { selectedCity } = useApp();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState('All Cities');

  useEffect(() => {
    setLoading(true);
    getLeaderboard(cityFilter === 'All Cities' ? null : cityFilter).then(data => {
      setEntries(data);
      setLoading(false);
    });
  }, [cityFilter]);

  const medalEmoji = (rank) => rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `${rank + 1}.`;

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>🏆 Community Leaderboard</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}>Our most active Seva contributors — ranked by impact score.</p>
      </div>

      {/* City filter */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '2rem' }}>
        {CITIES.map(city => (
          <button key={city} onClick={() => setCityFilter(city)}
            className={cityFilter === city ? 'filter-chip active' : 'filter-chip'}
          >{city}</button>
        ))}
      </div>

      {/* Score explainer */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
        {[['Add a Seva', '+10 pts'], ['Verify one', '+2 pts'], ['Post comment', '+1 pt'], ['Get upvote', '+1 pt']].map(([action, pts]) => (
          <div key={action} style={{ background: 'var(--color-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-xs)', textAlign: 'center', borderTop: '2px solid var(--color-primary)' }}>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-primary)' }}>{pts}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>{action}</div>
          </div>
        ))}
      </div>

      {/* Leaderboard table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>Loading rankings...</div>
      ) : (
        <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
          {entries.map((entry, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '1.25rem',
              padding: '1.125rem 1.5rem',
              borderBottom: i < entries.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
              background: i < 3 ? `linear-gradient(90deg, rgba(255,153,51,${0.04 - i * 0.01}) 0%, transparent 100%)` : 'transparent',
              transition: 'background 0.2s'
            }}>
              <div style={{ fontSize: i < 3 ? '1.5rem' : '1rem', width: '2rem', textAlign: 'center', fontWeight: 700, color: 'var(--color-text-secondary)', flexShrink: 0 }}>{medalEmoji(i)}</div>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `hsl(${(i * 47) % 360}, 60%, 85%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', flexShrink: 0 }}>
                {entry.displayName?.[0]?.toUpperCase() || '?'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {entry.displayName || 'Anonymous'}
                  {entry.isVerifiedOrganizer && <span style={{ background: '#DBEAFE', color: '#1D4ED8', fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '2rem' }}>✓ Verified</span>}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>📍 {entry.city} • {entry.sevasAdded} Sevas added</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontWeight: 900, fontSize: '1.25rem', color: 'var(--color-primary)' }}>{entry.contributionScore}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>pts</div>
              </div>
            </div>
          ))}
          {entries.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
              No contributors yet in this city. Be the first!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
