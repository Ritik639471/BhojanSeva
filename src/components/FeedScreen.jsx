import SevaCard from './SevaCard';

export default function FeedScreen({ sevas, onSelectSeva }) {
  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '1.25rem 1rem 6rem', background: 'var(--color-bg)' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {sevas.length > 0 && (
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 0.25rem', marginBottom: '0.25rem' }}>
            {sevas.length} Seva{sevas.length !== 1 ? 's' : ''} found
          </div>
        )}

        {sevas.map(seva => (
          <SevaCard key={seva.id} seva={seva} onClick={() => onSelectSeva(seva)} />
        ))}

        {sevas.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--color-text-secondary)' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🍲</div>
            <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>No Sevas Found</h3>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>No food camps match your current filter.<br />Try clearing the search or change the filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
