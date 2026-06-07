import { useState } from 'react';
import { Flag, X } from 'lucide-react';
import { submitReport } from '../services/SevaService';

const REASONS = [
  { id: 'fake', label: '🚫 Fake or Non-Existent', desc: 'This listing does not exist at the stated location.' },
  { id: 'expired', label: '⏰ Already Finished', desc: 'The Seva ended but the pin was not removed.' },
  { id: 'wrong_info', label: '❌ Wrong Information', desc: 'The food, location, or time details are incorrect.' },
  { id: 'spam', label: '💬 Spam / Advertisement', desc: 'This listing is promotional and not a genuine free seva.' },
  { id: 'offensive', label: '⚠️ Offensive Content', desc: 'The listing contains inappropriate content.' },
];

export default function ReportModal({ seva, onClose }) {
  const [selectedReason, setSelectedReason] = useState(null);
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReason) return;
    setSubmitting(true);
    await submitReport(seva.id, selectedReason, details);
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', padding: '3rem', textAlign: 'center', maxWidth: '380px', boxShadow: 'var(--shadow-floating)', animation: 'scaleUp 0.3s ease-out' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
        <h3 style={{ marginBottom: '0.5rem' }}>Report Submitted</h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>Thank you for keeping BhojanSeva accurate. Our moderation team will review this listing.</p>
        <button className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%' }} onClick={onClose}>Close</button>
      </div>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: '1rem' }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', padding: '2rem', maxWidth: '460px', width: '100%', boxShadow: 'var(--shadow-floating)', animation: 'scaleUp 0.3s ease-out' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Flag size={20} style={{ color: 'var(--color-danger)' }} />
            <h3 style={{ margin: 0 }}>Report This Seva</h3>
          </div>
          <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', cursor: 'pointer', padding: '0.45rem', borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
          Reporting: <strong>{seva.title}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {REASONS.map(reason => (
              <div key={reason.id} onClick={() => setSelectedReason(reason.id)}
                style={{ padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', border: `1.5px solid ${selectedReason === reason.id ? 'var(--color-danger)' : '#E2E8F0'}`, background: selectedReason === reason.id ? 'var(--color-danger-bg)' : 'var(--color-surface)', transition: 'all 0.2s' }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: selectedReason === reason.id ? 'var(--color-danger)' : 'var(--color-text-primary)' }}>{reason.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>{reason.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Additional Details (Optional)</label>
            <textarea rows={3} placeholder="Any additional context that may help our moderators..." value={details} onChange={e => setDetails(e.target.value)} className="form-textarea" />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" disabled={!selectedReason || submitting}
              style={{ flex: 1, background: 'var(--color-danger)', color: 'white', border: 'none', borderRadius: 'var(--radius-full)', padding: '0.75rem', fontWeight: 700, cursor: selectedReason ? 'pointer' : 'not-allowed', opacity: selectedReason ? 1 : 0.6, fontFamily: 'inherit', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Flag size={16} /> {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
