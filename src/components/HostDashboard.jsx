import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, Users, TrendingUp, CheckCircle, Clock, Download } from 'lucide-react';
import { getUserSevas, deleteSeva, updateSeva } from '../services/SevaService';
import { useAuth } from '../context/AuthContext';

export default function HostDashboard({ onAddSeva, onSelectSeva }) {
  const { user } = useAuth();
  const [mySevas, setMySevas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [stats, setStats] = useState({ total: 0, active: 0, totalGoings: 0, totalServings: 0 });
  const [premiumRequested, setPremiumRequested] = useState(false);

  useEffect(() => {
    if (!user) return;
    getUserSevas(user.id).then(sevas => {
      setMySevas(sevas);
      setStats({
        total: sevas.length,
        active: sevas.filter(s => s.isLive && s.status !== 'finished').length,
        totalGoings: sevas.reduce((a, s) => a + (s.goingCount || 0), 0),
        totalServings: sevas.reduce((a, s) => a + (s.estimatedServings || 0), 0),
      });
      setLoading(false);
    });
  }, [user]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this Seva?')) return;
    setDeletingId(id);
    await deleteSeva(id);
    setMySevas(prev => prev.filter(s => s.id !== id));
    setDeletingId(null);
  };

  const handleToggleLive = async (seva) => {
    const updated = { ...seva, isLive: !seva.isLive };
    await updateSeva(seva.id, { isLive: !seva.isLive });
    setMySevas(prev => prev.map(s => s.id === seva.id ? updated : s));
  };

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
        <h3>Login Required</h3>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>Sign in to manage your Seva camps.</p>
      </div>
    );
  }

  const statCards = [
    { icon: <TrendingUp size={22} />, num: stats.total, label: 'Total Sevas', color: '#8B5CF6' },
    { icon: <CheckCircle size={22} />, num: stats.active, label: 'Active Now', color: 'var(--color-success)' },
    { icon: <Users size={22} />, num: stats.totalGoings, label: 'People Going', color: 'var(--color-primary)' },
    { icon: <Eye size={22} />, num: stats.totalServings.toLocaleString(), label: 'Meals Planned', color: '#06B6D4' },
  ];

  const handleGeneratePDF = () => {
    // A simple programmatic print implementation
    // In production, you'd use jsPDF or html2pdf.js here
    window.print();
  };

  return (
    <div className="host-dashboard-container">
      {/* Header */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>My Host Dashboard</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>Manage your Seva camps and track engagement</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={handleGeneratePDF}>
            <Download size={16} /> PDF Report
          </button>
          <button className="btn btn-primary" onClick={onAddSeva}>
            <Plus size={18} /> Add New Seva
          </button>
        </div>
      </div>

      {/* Print Only Header */}
      <div className="print-only" style={{ display: 'none', textAlign: 'center', marginBottom: '2rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '1rem' }}>
        <h1>BhojanSeva Impact Report</h1>
        <p>Organizer: {user.user_metadata?.name || user.email}</p>
        <p>Generated on: {new Date().toLocaleDateString()}</p>
      </div>

      {/* Premium Badge Banner */}
      <div className="no-print" style={{ background: premiumRequested ? 'var(--color-success-bg)' : 'rgba(29,78,216,0.05)', border: `1px solid ${premiumRequested ? 'var(--color-success)' : 'rgba(29,78,216,0.2)'}`, borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', margin: '0 0 0.25rem', color: premiumRequested ? 'var(--color-success)' : '#1D4ED8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <CheckCircle size={18} /> Premium Verified Organizer
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Get the Blue Tick ✓ on your sevas to build trust with seekers.</p>
        </div>
        <button onClick={() => setPremiumRequested(!premiumRequested)} className="btn" style={{ background: premiumRequested ? 'white' : '#1D4ED8', color: premiumRequested ? 'var(--color-success)' : 'white', border: `1.5px solid ${premiumRequested ? 'var(--color-success)' : '#1D4ED8'}`, padding: '0.6rem 1.25rem', fontWeight: 700, borderRadius: 'var(--radius-full)' }}>
          {premiumRequested ? 'Badge Active ✓' : 'Get Verified Badge'}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {statCards.map(({ icon, num, label, color }) => (
          <div key={label} style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', borderTop: `3px solid ${color}`, textAlign: 'center' }}>
            <div style={{ color, marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>{icon}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color }}>{num}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600, marginTop: '0.25rem' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Seva list */}
      <h2 className="no-print" style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Your Listings</h2>
      <h2 className="print-only" style={{ display: 'none', fontSize: '1.25rem', marginBottom: '1.25rem' }}>Listing Breakdown</h2>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>Loading your sevas...</div>
      ) : mySevas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍛</div>
          <h3>No Sevas Yet</h3>
          <p style={{ color: 'var(--color-text-secondary)', margin: '0.5rem 0 1.5rem' }}>Add your first Seva camp to get started.</p>
          <button className="btn btn-primary" onClick={onAddSeva}><Plus size={16} /> Add First Seva</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {mySevas.map(seva => (
            <div key={seva.id} style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', display: 'flex', gap: '1.25rem', alignItems: 'flex-start', borderLeft: `4px solid ${seva.isLive && seva.status !== 'finished' ? 'var(--color-success)' : '#94A3B8'}` }}>
              {/* Photo thumbnail */}
              {seva.photoUrl && <img src={seva.photoUrl} alt="" style={{ width: '80px', height: '70px', borderRadius: 'var(--radius-md)', objectFit: 'cover', flexShrink: 0 }} />}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.05rem', margin: 0 }}>{seva.title}</h3>
                  {seva.isVerified && <span style={{ background: '#DBEAFE', color: '#1D4ED8', fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '2rem' }}>✓ Verified</span>}
                  {seva.sponsorName && <span style={{ background: 'rgba(255,153,51,0.1)', color: 'var(--color-primary)', fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '2rem' }}>💰 Sponsored</span>}
                </div>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: '0 0 0.75rem' }}>🍲 {seva.food}</p>
                <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
                  <span>👥 {seva.goingCount || 0} going</span>
                  <span>🍽️ {seva.servingsLeft || 0}/{seva.estimatedServings || 0} left</span>
                  <span><Clock size={12} style={{ verticalAlign: 'middle' }} /> {seva.time}</span>
                </div>
              </div>

              <div className="no-print" style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, alignItems: 'center' }}>
                {/* Live toggle */}
                <button
                  onClick={() => handleToggleLive(seva)}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'inherit', borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer', background: seva.isLive ? 'var(--color-success-bg)' : '#F1F5F9', color: seva.isLive ? 'var(--color-success)' : 'var(--color-text-secondary)', transition: 'all 0.2s' }}
                >
                  {seva.isLive ? '🟢 Live' : '⭕ Offline'}
                </button>
                <button onClick={() => onSelectSeva(seva)} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', gap: '0.25rem' }}><Eye size={13} /></button>
                <button onClick={() => handleDelete(seva.id)} disabled={deletingId === seva.id} style={{ padding: '0.35rem', fontSize: '0.75rem', background: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  {deletingId === seva.id ? '...' : <Trash2 size={15} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Print Styles injected locally */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white; }
          .host-dashboard-container { padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}
