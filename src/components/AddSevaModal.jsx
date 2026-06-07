import { useState, useEffect, useRef } from 'react';
import { X, MapPin, Loader2, Camera, Sparkles, AlertTriangle, Clock } from 'lucide-react';
import { uploadSevaPhoto, generateAIDescription } from '../services/SevaService';

const SEVA_TYPES = ['Bhandara', 'Langar', 'Iftar', 'Prasad', 'Other'];
const AVAILABLE_TAGS = ['Jain', 'Sweet Prasad', 'Full Meal', 'Drinking Water', 'Snacks'];
const ALLERGENS = ['Gluten', 'Dairy', 'Nuts', 'Eggs', 'Soy', 'Sesame'];
const TAG_ICONS = { 'Jain': '🍃', 'Sweet Prasad': '🍬', 'Full Meal': '🍛', 'Drinking Water': '💧', 'Snacks': '🍪' };
const ALLERGEN_ICONS = { Gluten: '🌾', Dairy: '🥛', Nuts: '🥜', Eggs: '🥚', Soy: '🫘', Sesame: '🌱' };
const TYPE_EMOJIS = { 'Bhandara': '🍛', 'Langar': '🕌', 'Iftar': '🌙', 'Prasad': '🙏', 'Other': '🤲' };

function ToggleSwitch({ checked, onChange, colorOn = 'var(--color-primary)' }) {
  return (
    <div onClick={() => onChange(!checked)} style={{ width: '42px', height: '24px', borderRadius: '12px', flexShrink: 0, background: checked ? colorOn : '#E2E8F0', position: 'relative', cursor: 'pointer', transition: 'background 0.25s ease', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}>
      <div style={{ position: 'absolute', top: '3px', left: checked ? '21px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.25s cubic-bezier(0.34,1.56,0.64,1)' }} />
    </div>
  );
}

function PhotoUpload({ photos, setPhotos }) {
  const inputRef = useRef();
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    // For local preview
    const localUrl = URL.createObjectURL(file);
    setPhotos(prev => [...prev, { file, url: localUrl }]);
    setUploading(false);
  };

  return (
    <div>
      <label style={{ display: 'block', marginBottom: '0.6rem', fontWeight: 700, fontSize: '0.8rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        <Camera size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.3rem' }} /> Food Photos
      </label>
      <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
        {photos.map((p, i) => (
          <div key={i} style={{ position: 'relative', width: '72px', height: '72px' }}>
            <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '2px solid rgba(255,153,51,0.3)' }} />
            <button onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--color-danger)', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>✕</button>
          </div>
        ))}
        {photos.length < 4 && (
          <div onClick={() => inputRef.current?.click()} style={{ width: '72px', height: '72px', borderRadius: 'var(--radius-md)', border: '2px dashed rgba(255,153,51,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-primary)', fontSize: '0.65rem', fontWeight: 700, gap: '0.2rem', transition: 'border-color 0.2s, background 0.2s', background: 'rgba(255,153,51,0.03)' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,153,51,0.06)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,153,51,0.03)'}>
            {uploading ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <><Camera size={20} /><span>Add Photo</span></>}
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFile} />
    </div>
  );
}

export default function AddSevaModal({ onClose, onSubmit }) {
  const [title, setTitle] = useState('');
  const [food, setFood] = useState('');
  const [selectedType, setSelectedType] = useState('Bhandara');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedAllergens, setSelectedAllergens] = useState([]);
  const [isSOS, setIsSOS] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [permanence, setPermanence] = useState('temporary');
  const [location, setLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState('Detecting...');
  const [estimatedServings, setEstimatedServings] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [photos, setPhotos] = useState([]);
  const [aiDescription, setAiDescription] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);
  const [sponsorName, setSponsorName] = useState('');
  const [activeSection, setActiveSection] = useState('basic');

  useEffect(() => {
    if ('geolocation' in navigator) {
      setGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (p) => {
          setLocation({ lat: p.coords.latitude, lng: p.coords.longitude });
          setGettingLocation(false);
          setLocationStatus(`📍 ${p.coords.latitude.toFixed(4)}, ${p.coords.longitude.toFixed(4)}`);
        },
        () => {
          setGettingLocation(false);
          setLocation({ lat: 28.6139, lng: 77.2090 });
          setLocationStatus('📍 Default: Connaught Place, New Delhi');
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setLocation({ lat: 28.6139, lng: 77.2090 });
      setLocationStatus('📍 Geolocation not supported.');
    }
  }, []);

  const handleTagToggle = (tag) => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  const handleAllergenToggle = (a) => setSelectedAllergens(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const handleGenerateAI = async () => {
    if (!food) return;
    setGeneratingAI(true);
    const desc = await generateAIDescription(food, selectedType);
    setAiDescription(desc || 'A heartfelt community meal prepared with love and devotion for all who are hungry.');
    setGeneratingAI(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !food) return;

    // Upload photos
    let photoUrl = null;
    let photoUrls = [];
    if (photos.length > 0) {
      // In mock mode, use object URLs; in real mode, upload to storage
      photoUrl = photos[0].url;
      photoUrls = photos.map(p => p.url);
    }

    onSubmit({
      title, food, type: selectedType, tags: selectedTags, allergens: selectedAllergens,
      isSOS, permanence, isMoving,
      status: 'serving', finishedVotes: [],
      time: startTime && endTime ? `${startTime} - ${endTime}` : permanence === 'permanent' ? 'Daily Schedule' : 'Active now',
      location: location || { lat: 28.6139, lng: 77.2090 },
      estimatedServings: parseInt(estimatedServings) || 0,
      servingsLeft: parseInt(estimatedServings) || 0,
      goingCount: 0,
      photoUrl, photoUrls,
      sponsorName: sponsorName || null,
      aiDescription: aiDescription || null,
      startTime: startTime ? new Date(startTime).toISOString() : null,
      endTime: endTime ? new Date(endTime).toISOString() : null,
    });
  };

  const sections = [
    { id: 'basic', label: '🍛 Basic', icon: '' },
    { id: 'details', label: '🏷️ Details', icon: '' },
    { id: 'schedule', label: '📅 Schedule', icon: '' },
    { id: 'media', label: '📷 Media', icon: '' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(6px)', zIndex: 2000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '620px', background: 'var(--color-surface)', borderTopLeftRadius: 'var(--radius-2xl)', borderTopRightRadius: 'var(--radius-2xl)', animation: 'slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)', maxHeight: '92vh', overflowY: 'auto', boxShadow: 'var(--shadow-floating)' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, rgba(255,153,51,0.1) 0%, rgba(255,249,245,1) 60%)', padding: '1.5rem 1.75rem 1.25rem', borderBottom: '1px solid rgba(255,153,51,0.1)', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ width: 40, height: 4, background: '#E2E8F0', borderRadius: 2, margin: '0 auto 1rem' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', margin: 0 }}>🍛 Add a Seva Camp</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', margin: '0.2rem 0 0' }}>Share free food with your community</p>
            </div>
            <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%' }}><X size={20} /></button>
          </div>
          {/* Section tabs */}
          <div style={{ display: 'flex', gap: '0.35rem', marginTop: '1rem' }}>
            {sections.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)} style={{ flex: 1, padding: '0.4rem 0.2rem', fontSize: '0.72rem', fontWeight: 700, fontFamily: 'inherit', borderRadius: 'var(--radius-md)', border: 'none', background: activeSection === s.id ? 'var(--color-primary)' : '#F1F5F9', color: activeSection === s.id ? 'white' : 'var(--color-text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* ── BASIC ── */}
          {activeSection === 'basic' && (
            <>
              {/* Type */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.6rem', fontWeight: 700, fontSize: '0.78rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Category</label>
                <div style={{ display: 'flex', gap: '0.45rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                  {SEVA_TYPES.map(type => (
                    <button key={type} type="button" onClick={() => setSelectedType(type)} className={selectedType === type ? 'filter-chip active' : 'filter-chip'}>
                      {TYPE_EMOJIS[type]} {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Permanence */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.6rem', fontWeight: 700, fontSize: '0.78rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Duration Type</label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {[{ value: 'temporary', label: '📍 Pop-Up', desc: 'Temporary camp' }, { value: 'permanent', label: '🏢 Institution', desc: 'Daily schedule' }].map(({ value, label, desc }) => (
                    <button key={value} type="button" onClick={() => setPermanence(value)} style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'inherit', border: `1.5px solid ${permanence === value ? 'var(--color-primary)' : '#E2E8F0'}`, background: permanence === value ? 'rgba(255,153,51,0.07)' : 'var(--color-surface)', color: permanence === value ? 'var(--color-primary)' : 'var(--color-text-secondary)', transition: 'all 0.2s', textAlign: 'left' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{label}</div>
                      <div style={{ fontSize: '0.72rem', opacity: 0.75, marginTop: '0.1rem' }}>{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.78rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Title / Location Name *</label>
                <input type="text" placeholder="e.g. Connaught Place Hanuman Mandir" value={title} onChange={e => setTitle(e.target.value)} className="form-input" required />
              </div>

              {/* Food + AI */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.78rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>What's Being Served? *</label>
                <div style={{ position: 'relative' }}>
                  <input type="text" placeholder="e.g. Puri Chole, Halwa, Dal Chawal" value={food} onChange={e => setFood(e.target.value)} className="form-input" required />
                  <button type="button" onClick={handleGenerateAI} disabled={!food || generatingAI} title="Generate AI description" style={{ position: 'absolute', right: '0.625rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: food ? 'pointer' : 'not-allowed', color: '#8B5CF6', padding: '0.25rem', borderRadius: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', fontWeight: 700 }}>
                    {generatingAI ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={14} />} AI
                  </button>
                </div>
                {aiDescription && (
                  <div style={{ marginTop: '0.5rem', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 'var(--radius-md)', padding: '0.625rem 0.875rem', fontSize: '0.82rem', color: '#6D28D9', fontStyle: 'italic', lineHeight: 1.5 }}>
                    <Sparkles size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.25rem' }} />
                    {aiDescription}
                    <button type="button" onClick={() => setAiDescription('')} style={{ marginLeft: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#6D28D9', fontSize: '0.7rem', fontWeight: 700 }}>✕</button>
                  </div>
                )}
              </div>

              {/* Estimated servings */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.78rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>🍽️ Estimated Plates / Servings</label>
                <input type="number" min="1" max="100000" placeholder="e.g. 500 plates" value={estimatedServings} onChange={e => setEstimatedServings(e.target.value)} className="form-input" />
              </div>
            </>
          )}

          {/* ── DETAILS ── */}
          {activeSection === 'details' && (
            <>
              {/* Dietary Tags */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.6rem', fontWeight: 700, fontSize: '0.78rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Dietary Tags</label>
                <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                  {AVAILABLE_TAGS.map(tag => (
                    <button key={tag} type="button" onClick={() => handleTagToggle(tag)} className={selectedTags.includes(tag) ? 'filter-chip active' : 'filter-chip'} style={{ fontSize: '0.8rem' }}>
                      {TAG_ICONS[tag]} {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Allergens */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.6rem', fontWeight: 700, fontSize: '0.78rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>⚠️ Contains Allergens</label>
                <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                  {ALLERGENS.map(a => (
                    <button key={a} type="button" onClick={() => handleAllergenToggle(a)}
                      style={{ padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer', border: `1.5px solid ${selectedAllergens.includes(a) ? 'var(--color-danger)' : '#E2E8F0'}`, background: selectedAllergens.includes(a) ? 'var(--color-danger-bg)' : 'var(--color-surface)', color: selectedAllergens.includes(a) ? 'var(--color-danger)' : 'var(--color-text-secondary)', transition: 'all 0.2s' }}>
                      {ALLERGEN_ICONS[a]} {a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { key: 'sos', label: '🚨 Seva SOS — Excess Food Alert', desc: 'Surplus perishable food needs urgent pickup.', value: isSOS, onChange: setIsSOS, color: 'var(--color-danger)' },
                  { key: 'moving', label: '🚚 Traveling Seva — Moving Pin', desc: 'Distributing from a moving van or rickshaw.', value: isMoving, onChange: setIsMoving, color: 'var(--color-primary)' },
                ].map(opt => (
                  <div key={opt.key} style={{ background: opt.value ? `${opt.color}06` : 'var(--color-bg)', border: `1.5px solid ${opt.value ? `${opt.color}40` : '#E2E8F0'}`, padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', transition: 'all 0.2s' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.875rem', color: opt.value ? opt.color : 'var(--color-text-primary)' }}>{opt.label}</h4>
                      <p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.35 }}>{opt.desc}</p>
                    </div>
                    <ToggleSwitch checked={opt.value} onChange={opt.onChange} colorOn={opt.color} />
                  </div>
                ))}
              </div>

              {/* Sponsor */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.78rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>💰 Sponsored By (Optional)</label>
                <input type="text" placeholder="e.g. XYZ Foundation" value={sponsorName} onChange={e => setSponsorName(e.target.value)} className="form-input" />
              </div>
            </>
          )}

          {/* ── SCHEDULE ── */}
          {activeSection === 'schedule' && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.78rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>🕐 Start Time</label>
                <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="form-input" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.78rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>🏁 End Time</label>
                <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className="form-input" />
              </div>
              <div style={{ background: 'rgba(255,153,51,0.06)', border: '1px solid rgba(255,153,51,0.2)', padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ margin: '0 0 0.35rem', fontSize: '0.85rem', color: 'var(--color-primary)' }}>⚡ Auto-Expiry</h4>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  When End Time is set, the pin will automatically gray out at that time — no manual action needed. Perfect for scheduled events.
                </p>
              </div>

              {/* Location */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--color-bg)', padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0,0,0,0.04)', borderLeft: `4px solid ${gettingLocation ? 'var(--color-primary)' : 'var(--color-success)'}` }}>
                {gettingLocation ? <Loader2 size={16} style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} /> : <MapPin size={16} style={{ color: 'var(--color-success)' }} />}
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{locationStatus}</span>
              </div>
            </>
          )}

          {/* ── MEDIA ── */}
          {activeSection === 'media' && (
            <>
              <PhotoUpload photos={photos} setPhotos={setPhotos} />
              <div style={{ background: 'rgba(255,153,51,0.04)', border: '1px solid rgba(255,153,51,0.15)', padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ margin: '0 0 0.35rem', fontSize: '0.85rem' }}>📸 Photo Tips</h4>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
                  <li>Show the actual food being served</li>
                  <li>Include the venue or table setup</li>
                  <li>Good lighting builds trust with seekers</li>
                  <li>Up to 4 photos allowed</li>
                </ul>
              </div>
              {photos.length > 0 && (
                <div style={{ background: 'var(--color-bg)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: 600 }}>
                  ✅ {photos.length} photo{photos.length > 1 ? 's' : ''} ready to publish
                </div>
              )}
            </>
          )}

          {/* Submit — always visible */}
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 0 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '0.875rem', fontSize: '1rem' }} disabled={gettingLocation || !title || !food}>
              <span className="live-dot" style={{ background: 'white' }} /> Publish — Go Live!
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
