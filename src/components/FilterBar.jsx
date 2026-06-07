import { useState } from 'react';
import { Search, MapPin, Loader2, X, Mic } from 'lucide-react';

const CATEGORIES = [
  { id: 'All', emoji: '✨' },
  { id: 'Bhandara', emoji: '🍛' },
  { id: 'Langar', emoji: '🕌' },
  { id: 'Iftar', emoji: '🌙' },
  { id: 'Prasad', emoji: '🙏' },
  { id: 'Other', emoji: '🤲' },
  { id: 'Saved', emoji: '🔖' }
];

export default function FilterBar({ activeFilter, onFilterChange, searchQuery, onSearchChange, nowFilter = 'all', onNowFilterChange }) {
  const [isSearching, setIsSearching] = useState(false);
  
  return (
    <div style={{ position: 'sticky', top: '64px', zIndex: 900, background: 'rgba(255, 249, 245, 0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,153,51,0.15)', padding: '0.75rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      
      {/* Top row: search & time filter */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} style={{ position: 'absolute', left: '1rem', color: isSearching ? 'var(--color-primary)' : 'var(--color-text-muted)', transition: 'color 0.2s' }} />
          <input
            type="text"
            placeholder="Search dal makhani, jain, CP..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsSearching(true)}
            onBlur={() => setIsSearching(false)}
            className="filter-search-input"
          />
          {searchQuery && (
            <button onClick={() => onSearchChange('')} style={{ position: 'absolute', right: '0.75rem', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} />
            </button>
          )}
        </div>
        
        {/* Time toggle (Now vs Upcoming vs All) */}
        {onNowFilterChange && (
          <div style={{ display: 'flex', background: 'var(--color-surface)', borderRadius: 'var(--radius-full)', padding: '0.2rem', boxShadow: 'var(--shadow-sm)', border: '1px solid rgba(0,0,0,0.05)' }}>
            {['all', 'now', 'upcoming'].map(f => (
              <button key={f} onClick={() => onNowFilterChange(f)} style={{ padding: '0.35rem 0.625rem', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'inherit', borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer', background: nowFilter === f ? 'var(--color-primary)' : 'transparent', color: nowFilter === f ? 'white' : 'var(--color-text-secondary)', transition: 'all 0.2s', textTransform: 'capitalize' }}>
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom row: category pills */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
        {CATEGORIES.map(({ id, emoji }) => (
          <button
            key={id}
            onClick={() => onFilterChange(id)}
            className={activeFilter === id ? 'filter-chip active' : 'filter-chip'}
          >
            {emoji} {id}
          </button>
        ))}
      </div>
    </div>
  );
}
