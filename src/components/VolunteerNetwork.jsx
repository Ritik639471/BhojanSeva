import { useState } from 'react';
import { Users, Heart, Handshake, Target, MapPin } from 'lucide-react';

const NGOS = [
  { name: 'Robin Hood Army', city: 'Nationwide', type: 'Food Rescue', verified: true },
  { name: 'Langar Aid', city: 'Punjab & Delhi', type: 'Disaster Relief', verified: true },
  { name: 'Annamrita Foundation', city: 'Mumbai', type: 'Mid-day Meals', verified: true },
  { name: 'Khalsa Aid India', city: 'Nationwide', type: 'Emergency Relief', verified: true }
];

export default function VolunteerNetwork() {
  const [joined, setJoined] = useState(false);

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🤝 Volunteer Network</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', maxWidth: '620px', margin: '0 auto' }}>Connect with local NGOs, food banks, and fellow volunteers to scale your impact.</p>
      </div>

      {/* Hero Action */}
      <div style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)', borderRadius: 'var(--radius-xl)', padding: '3rem', color: 'white', textAlign: 'center', marginBottom: '3rem', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <Users size={32} color="white" />
        </div>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Become a BhojanSeva Volunteer</h2>
        <p style={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: '500px', margin: '0 auto 2rem' }}>Help verify listings, distribute surplus food from SOS alerts, and map new permanent camps.</p>
        <button onClick={() => setJoined(true)} disabled={joined} style={{ background: 'white', color: 'var(--color-primary)', border: 'none', padding: '1rem 2.5rem', borderRadius: 'var(--radius-full)', fontSize: '1.1rem', fontWeight: 800, cursor: joined ? 'default' : 'pointer', transition: 'transform 0.2s', transform: joined ? 'scale(1)' : 'scale(1.05)' }}>
          {joined ? '✅ Welcome to the Team!' : 'Join the Force'}
        </button>
      </div>

      {/* Verified NGOs Grid */}
      <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>🏛️ Partner Organizations</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.25rem', marginBottom: '4rem' }}>
        {NGOS.map((ngo, i) => (
          <div key={i} style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(255,153,51,0.1)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}><Handshake size={20} /></div>
              {ngo.verified && <span style={{ background: '#DBEAFE', color: '#1D4ED8', fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '2rem' }}>✓ Verified NGO</span>}
            </div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.3rem' }}>{ngo.name}</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
              <MapPin size={12} /> {ngo.city}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
              <Target size={12} /> {ngo.type}
            </div>
            <button className="btn btn-secondary" style={{ width: '100%', marginTop: '1.25rem', fontSize: '0.8rem' }}>Contact</button>
          </div>
        ))}
      </div>

      {/* Community Guidelines snippet */}
      <div style={{ background: 'rgba(255,153,51,0.04)', padding: '2rem', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(255,153,51,0.15)', display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <div style={{ fontSize: '4rem' }}>💖</div>
        <div>
          <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Volunteer Ethos</h4>
          <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>We serve with dignity. Food is a fundamental right, not a privilege. As a volunteer, your primary role is to ensure accurate information, fast response to SOS signals, and respectful conduct at all distribution sites.</p>
        </div>
      </div>
    </div>
  );
}
