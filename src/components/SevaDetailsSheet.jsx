import { X, Navigation, Share2, ThumbsUp, ThumbsDown, CheckCircle, AlertTriangle, XCircle, Bookmark, BookmarkCheck, Flag, Users, Camera, Sparkles, Heart } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { toggleGoing, isUserGoing } from '../services/SevaService';
import ReportModal from './ReportModal';

const TAG_DETAILS = {
  'Jain': { icon: '🍃', color: '#E8F5E9', text: '#2E7D32' },
  'Sweet Prasad': { icon: '🍬', color: '#FFF3E0', text: '#E65100' },
  'Full Meal': { icon: '🍛', color: '#E0F7FA', text: '#006064' },
  'Drinking Water': { icon: '💧', color: '#E3F2FD', text: '#0D47A1' },
  'Snacks': { icon: '🍪', color: '#F3E5F5', text: '#4A148C' }
};

const ALLERGEN_ICONS = { Gluten: '🌾', Dairy: '🥛', Nuts: '🥜', Eggs: '🥚', Soy: '🫘', Sesame: '🌱' };

export default function SevaDetailsSheet({ seva, onClose, onUpdateSeva }) {
  const { user } = useAuth();
  const { toggleSaved, isSaved } = useApp();
  const [trustVote, setTrustVote] = useState(null);
  const [inlineToast, setInlineToast] = useState(null);
  const [userGoing, setUserGoing] = useState(false);
  const [goingCount, setGoingCount] = useState(seva.goingCount || 0);
  const [showReport, setShowReport] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [weather, setWeather] = useState(null);
  const [comments, setComments] = useState(() => {
    const saved = localStorage.getItem(`seva_comments_${seva.id}`);
    if (saved) return JSON.parse(saved);
    return [
      { id: 1, name: 'Aarav Sharma', text: 'Verified. Food is fresh and served with devotion.', date: '2h ago' },
      { id: 2, name: 'Pooja Singh', text: 'Queue moving quickly. Clean water available too.', date: '4h ago' }
    ];
  });
  const [newComment, setNewComment] = useState('');

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setUserGoing(isUserGoing(seva.id)); }, [seva.id]);

  useEffect(() => {
    if (seva.location?.lat) {
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${seva.location.lat}&longitude=${seva.location.lng}&current_weather=true`)
        .then(r => r.json())
        .then(data => {
          if (data.current_weather) {
            const w = data.current_weather;
            const emoji = w.weathercode <= 3 ? '☀️' : w.weathercode <= 60 ? '☁️' : '🌧️';
            setWeather(`${emoji} ${w.temperature}°C`);
          }
        }).catch(console.error);
    }
  }, [seva.location]);

  const showToast = (type, message) => {
    setInlineToast({ type, message });
    setTimeout(() => setInlineToast(null), 3500);
  };

  const handleShare = () => {
    // Generate deep link
    const deepLink = `${window.location.origin}/?page=app&sevaId=${seva.id}`;
    const text = `Free ${seva.title} serving ${seva.food}. Track live on BhojanSeva!\n${deepLink}`;
    if (navigator.share) navigator.share({ title: 'BhojanSeva', text, url: deepLink }).catch(console.error);
    else { navigator.clipboard.writeText(text); showToast('success', '🔗 Link copied to clipboard!'); }
  };

  const handleGoing = async () => {
    const now = await toggleGoing(seva.id);
    setUserGoing(now);
    setGoingCount(prev => now ? prev + 1 : Math.max(0, prev - 1));
    showToast('success', now ? "✅ You're going! See you there." : "Removed from going list.");
    if (onUpdateSeva) onUpdateSeva({ ...seva, goingCount: goingCount + (now ? 1 : -1) });
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const obj = { id: Date.now(), name: user?.user_metadata?.name || 'Guest', text: newComment.trim(), date: 'Just now' };
    const updated = [...comments, obj];
    setComments(updated);
    localStorage.setItem(`seva_comments_${seva.id}`, JSON.stringify(updated));
    setNewComment('');
  };

  const handleStatusReport = (newStatus) => {
    let updated = { ...seva };
    if (newStatus === 'finished') {
      const now = Date.now(), tenMin = now - 10 * 60 * 1000;
      const current = (seva.finishedVotes || []).filter(v => v > tenMin);
      const newVotes = [...current, now];
      updated.finishedVotes = newVotes;
      if (newVotes.length >= 3) {
        updated.status = 'finished'; updated.isLive = false; updated.isSOS = false;
        showToast('danger', '❌ Seva grayed out after 3 community "Finished" reports.');
      } else {
        showToast('warning', `⚠️ Finished report logged. ${newVotes.length}/3 reports needed.`);
      }
    } else {
      updated.status = newStatus;
      if (newStatus === 'serving') { updated.isLive = true; showToast('success', '✅ Status: Serving Now!'); }
      else if (newStatus === 'low') showToast('warning', '⚠️ Status: Running Low.');
    }
    if (onUpdateSeva) onUpdateSeva(updated);
  };

  const handleToggleSOS = () => {
    const updated = { ...seva, isSOS: !seva.isSOS };
    showToast(updated.isSOS ? 'danger' : 'success', updated.isSOS ? '🚨 SOS Alert activated!' : '✅ SOS deactivated.');
    if (onUpdateSeva) onUpdateSeva(updated);
  };

  const nowMs = useMemo(() => new Date().getTime(), []);
  const isFinished = seva.status === 'finished' || !seva.isLive;
  const votesNeeded = Math.max(0, 3 - ((seva.finishedVotes || []).filter(v => v > nowMs - 10 * 60 * 1000).length));
  const saved = isSaved(seva.id);
  const allPhotos = [seva.photoUrl, ...(seva.photoUrls || [])].filter(Boolean);

  // Servings progress
  const servingsPct = seva.estimatedServings > 0 ? Math.round((seva.servingsLeft / seva.estimatedServings) * 100) : null;

  const statusBtnStyle = (active, col) => ({
    flex: 1, padding: '0.7rem 0.35rem', fontSize: '0.8rem',
    background: active ? (col === 'g' ? 'var(--color-success-bg)' : col === 'o' ? 'var(--color-warning-bg)' : 'var(--color-danger-bg)') : 'var(--color-surface)',
    border: `1.5px solid ${active ? (col === 'g' ? 'var(--color-success)' : col === 'o' ? 'var(--color-warning)' : 'var(--color-danger)') : '#E2E8F0'}`,
    color: active ? (col === 'g' ? 'var(--color-success)' : col === 'o' ? '#D97706' : 'var(--color-danger)') : 'var(--color-text-secondary)',
    borderRadius: 'var(--radius-md)', cursor: isFinished && col !== 'r' ? 'not-allowed' : 'pointer',
    fontWeight: 700, fontFamily: 'inherit', transition: 'all 0.2s ease', transform: active ? 'scale(1.02)' : 'scale(1)'
  });

  return (
    <>
      {showReport && <ReportModal seva={seva} onClose={() => setShowReport(false)} />}

      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 2000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
        <div className="glass-deep" style={{ width: '100%', maxWidth: '660px', background: 'var(--color-surface)', borderTopLeftRadius: 'var(--radius-2xl)', borderTopRightRadius: 'var(--radius-2xl)', padding: 0, animation: 'slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)', maxHeight: '92vh', overflowY: 'auto', boxShadow: 'var(--shadow-floating)' }}>

          {/* Photo carousel / header */}
          {allPhotos.length > 0 ? (
            <div style={{ position: 'relative', height: '220px', overflow: 'hidden', borderTopLeftRadius: 'var(--radius-2xl)', borderTopRightRadius: 'var(--radius-2xl)' }}>
              <img src={allPhotos[activePhotoIdx]} alt={seva.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)' }} />
              {allPhotos.length > 1 && (
                <>
                  <button onClick={() => setActivePhotoIdx(p => Math.max(0, p - 1))} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '1rem' }}>‹</button>
                  <button onClick={() => setActivePhotoIdx(p => Math.min(allPhotos.length - 1, p + 1))} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '1rem' }}>›</button>
                  <div style={{ position: 'absolute', bottom: '0.75rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '4px' }}>
                    {allPhotos.map((_, i) => <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === activePhotoIdx ? 'white' : 'rgba(255,255,255,0.5)' }} />)}
                  </div>
                </>
              )}
              <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', border: 'none', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
              {/* Status overlay */}
              <div style={{ position: 'absolute', bottom: '1rem', left: '1rem' }}>
                {seva.isSOS && !isFinished ? <span className="sos-pulse-badge">🚨 SOS</span>
                  : isFinished ? <span className="status-pill finished">❌ Ended</span>
                  : seva.status === 'low' ? <span className="status-pill low">⚠️ Low</span>
                  : <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(16,185,129,0.9)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: 700 }}><span className="live-dot" style={{ background: 'white' }} />Live</div>}
              </div>
            </div>
          ) : (
            /* Gradient header (no photo) */
            <div style={{ background: isFinished ? 'linear-gradient(135deg, #F1F5F9, #E2E8F0)' : 'linear-gradient(135deg, rgba(255,153,51,0.1) 0%, rgba(255,249,245,1) 60%)', padding: '1.5rem 1.75rem 1.25rem' }}>
              <div style={{ width: 40, height: 4, background: '#E2E8F0', borderRadius: 2, margin: '0 auto 1rem' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    {seva.isSOS && !isFinished ? <span className="sos-pulse-badge">🚨 SOS</span>
                      : isFinished ? <span className="status-pill finished">❌ Ended</span>
                      : seva.status === 'low' ? <span className="status-pill low">⚠️ Low</span>
                      : <><span className="live-dot" /><span style={{ color: 'var(--color-success)', fontWeight: 700, fontSize: '0.85rem' }}>Active Now</span></>}
                    {seva.isVerified && <span style={{ background: '#DBEAFE', color: '#1D4ED8', fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '2rem' }}>✓ Verified</span>}
                  </div>
                </div>
                <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%' }} onMouseOver={e => e.currentTarget.style.background = '#E2E8F0'} onMouseOut={e => e.currentTarget.style.background = '#F1F5F9'}><X size={20} /></button>
              </div>
            </div>
          )}

          {/* Body */}
          <div style={{ padding: '1.5rem 1.75rem' }}>
            {/* Title + meta */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.55rem', margin: '0 0 0.3rem', textDecoration: isFinished ? 'line-through' : 'none' }}>{seva.title}</h2>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', margin: 0 }}>🍲 {seva.food}</p>
                </div>
                {/* Action buttons: save + report */}
                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                  <button onClick={() => toggleSaved(seva.id)} title={saved ? 'Unsave' : 'Save'} style={{ background: saved ? 'rgba(255,153,51,0.1)' : '#F1F5F9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: saved ? 'var(--color-primary)' : 'var(--color-text-secondary)', transition: 'all 0.2s' }}>
                    {saved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
                  </button>
                  <button onClick={() => setShowReport(true)} title="Report" style={{ background: '#FEF2F2', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-danger)', transition: 'all 0.2s' }}>
                    <Flag size={16} />
                  </button>
                </div>
              </div>

              {/* Going counter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
                <Users size={14} style={{ color: 'var(--color-text-muted)' }} />
                <span style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{goingCount} people going</span>
                {seva.sponsorName && (
                  <span style={{ marginLeft: 'auto', background: 'rgba(255,153,51,0.1)', color: 'var(--color-primary)', fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '2rem' }}>
                    💰 Sponsored by {seva.sponsorName}
                  </span>
                )}
              </div>
            </div>

            {/* Inline toast */}
            {inlineToast && (
              <div className={`inline-toast ${inlineToast.type}`} style={{ marginBottom: '1rem' }}>
                {inlineToast.type === 'success' ? <CheckCircle size={15} /> : inlineToast.type === 'warning' ? <AlertTriangle size={15} /> : <XCircle size={15} />}
                {inlineToast.message}
              </div>
            )}

            {/* AI Description */}
            {seva.aiDescription && (
              <div style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <Sparkles size={15} style={{ color: '#8B5CF6', marginTop: '2px', flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#6D28D9', fontStyle: 'italic', lineHeight: 1.5 }}>{seva.aiDescription}</p>
              </div>
            )}

            {/* Tags & Weather */}
            {(seva.tags?.length > 0 || seva.permanence === 'permanent' || seva.isMoving || weather) && (
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
                {weather && <span className="seva-tag-badge" style={{ backgroundColor: '#F3F4F6', color: '#4B5563', fontWeight: 800 }}>{weather}</span>}
                {seva.permanence === 'permanent' && <span className="seva-tag-badge" style={{ backgroundColor: '#EDE9FE', color: '#6D28D9' }}>🏢 Permanent</span>}
                {seva.isMoving && <span className="seva-tag-badge" style={{ backgroundColor: '#FFFBEB', color: '#D97706' }}>🚚 Traveling</span>}
                {seva.tags?.map(t => { const d = TAG_DETAILS[t] || { icon: '🏷️', color: '#F1F5F9', text: '#64748B' }; return <span key={t} className="seva-tag-badge" style={{ backgroundColor: d.color, color: d.text }}>{d.icon} {t}</span> })}
              </div>
            )}

            {/* Allergens */}
            {seva.allergens?.length > 0 && (
              <div style={{ background: '#FEF2F2', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 'var(--radius-md)', padding: '0.625rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-danger)', flexShrink: 0 }}>⚠️ Contains:</span>
                {seva.allergens.map(a => <span key={a} style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', fontSize: '0.72rem', fontWeight: 600, padding: '0.1rem 0.45rem', borderRadius: '2rem' }}>{ALLERGEN_ICONS[a] || '⚠️'} {a}</span>)}
              </div>
            )}

            {/* Servings bar */}
            {seva.estimatedServings > 0 && (
              <div style={{ background: 'var(--color-bg)', padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', border: '1px solid rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>🍽️ Servings Left</span>
                  <span style={{ color: servingsPct > 40 ? 'var(--color-success)' : servingsPct > 15 ? '#D97706' : 'var(--color-danger)' }}>
                    {seva.servingsLeft} / {seva.estimatedServings}
                  </span>
                </div>
                <div className="trust-bar-track">
                  <div className="trust-bar-fill" style={{ width: `${servingsPct}%`, background: servingsPct > 40 ? 'linear-gradient(90deg, var(--color-success), #059669)' : servingsPct > 15 ? 'linear-gradient(90deg, #F59E0B, #D97706)' : 'linear-gradient(90deg, var(--color-danger), #DC2626)' }} />
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.625rem', marginBottom: '1.25rem' }}>
              <button className="btn btn-primary" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${seva.location.lat},${seva.location.lng}`, '_blank')} disabled={isFinished}>
                <Navigation size={16} /> Go
              </button>
              <button onClick={handleGoing} style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-full)', border: `1.5px solid ${userGoing ? 'var(--color-success)' : '#E2E8F0'}`, background: userGoing ? 'var(--color-success-bg)' : 'var(--color-surface)', color: userGoing ? 'var(--color-success)' : 'var(--color-text-primary)', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', transition: 'all 0.2s' }}>
                <Users size={15} /> {userGoing ? "Going ✓" : "I'm Going"}
              </button>
              <button className="btn btn-secondary" style={{ color: '#25D366', borderColor: 'rgba(37,211,102,0.4)' }} onClick={handleShare}>
                <Share2 size={16} /> Share
              </button>
            </div>

            {/* Status meter */}
            <div style={{ background: 'var(--color-bg)', padding: '1.125rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(0,0,0,0.05)', marginBottom: '1.125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700 }}>📊 Crowd & Status Meter</h4>
                {!isFinished && <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>{3 - votesNeeded}/3 finished votes</span>}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button style={statusBtnStyle(seva.status === 'serving', 'g')} onClick={() => handleStatusReport('serving')} disabled={isFinished}>🟢 Serving</button>
                <button style={statusBtnStyle(seva.status === 'low', 'o')} onClick={() => handleStatusReport('low')} disabled={isFinished}>⚠️ Low</button>
                <button style={statusBtnStyle(seva.status === 'finished', 'r')} onClick={() => handleStatusReport('finished')}>❌ Finished</button>
              </div>
            </div>

            {/* SOS */}
            {!isFinished && (
              <div style={{ background: seva.isSOS ? 'rgba(239,68,68,0.04)' : 'rgba(139,92,246,0.04)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: `1.5px solid ${seva.isSOS ? 'rgba(239,68,68,0.25)' : 'rgba(139,92,246,0.2)'}`, marginBottom: '1.125rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                  <div>
                    <h4 style={{ margin: 0, color: seva.isSOS ? 'var(--color-danger)' : '#6B21A8', fontSize: '0.875rem' }}>🚨 Seva SOS Alert</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem', lineHeight: 1.4 }}>
                      {seva.isSOS ? 'Excess food! Volunteers/NGOs alerted — please collect immediately.' : 'Activate if you have excess food needing urgent pickup.'}
                    </p>
                  </div>
                  <button onClick={handleToggleSOS} style={{ padding: '0.4rem 0.875rem', fontSize: '0.8rem', fontWeight: 700, fontFamily: 'inherit', background: seva.isSOS ? 'var(--color-danger)' : '#8B5CF6', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', flexShrink: 0, transition: 'transform 0.15s', boxShadow: 'var(--shadow-xs)' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.04)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                    {seva.isSOS ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            )}

            {/* Trust vote */}
            {!isFinished && (
              <div style={{ background: 'var(--color-bg)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(0,0,0,0.04)', marginBottom: '1.125rem' }}>
                <h4 style={{ margin: '0 0 0.625rem', fontSize: '0.875rem', fontWeight: 700 }}>Is this still serving?</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button className="btn" onClick={() => setTrustVote('up')} style={{ flex: 1, padding: '0.5rem', background: trustVote === 'up' ? 'var(--color-success-bg)' : 'var(--color-surface)', border: `1.5px solid ${trustVote === 'up' ? 'var(--color-success)' : '#E2E8F0'}`, color: trustVote === 'up' ? 'var(--color-success)' : 'var(--color-text-secondary)' }}><ThumbsUp size={15} /> Yes</button>
                  <button className="btn" onClick={() => setTrustVote('down')} style={{ flex: 1, padding: '0.5rem', background: trustVote === 'down' ? 'var(--color-danger-bg)' : 'var(--color-surface)', border: `1.5px solid ${trustVote === 'down' ? 'var(--color-danger)' : '#E2E8F0'}`, color: trustVote === 'down' ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}><ThumbsDown size={15} /> No</button>
                  <div style={{ textAlign: 'center', minWidth: '56px' }}>
                    <div style={{ fontWeight: 900, color: 'var(--color-primary)', fontSize: '1.2rem', lineHeight: 1 }}>{seva.trustScore ?? 100}%</div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Trust</div>
                  </div>
                </div>
              </div>
            )}

            {/* Comments */}
            <div className="comments-section">
              <h4 style={{ margin: '0 0 0.625rem', fontSize: '0.875rem', fontWeight: 700 }}>💬 Community Updates</h4>
              <div className="comments-list">
                {comments.map(c => (
                  <div key={c.id} className="comment-card">
                    <div className="comment-meta"><span>👤 {c.name}</span><span style={{ fontWeight: 400 }}>{c.date}</span></div>
                    <div className="comment-text">{c.text}</div>
                  </div>
                ))}
                {comments.length === 0 && <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', textAlign: 'center', margin: '1rem 0' }}>No updates yet. Be first!</p>}
              </div>
              <form onSubmit={handleAddComment} className="comment-input-form">
                <input type="text" placeholder="Post a status update or tip..." value={newComment} onChange={e => setNewComment(e.target.value)} className="form-input" style={{ flex: 1, padding: '0.5rem 0.875rem', fontSize: '0.875rem' }} required />
                <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 0.875rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)' }}>Post</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
