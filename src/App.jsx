import { useState, useEffect, useCallback, useRef } from 'react'
import { Map, List, Plus, Bell, User, Info, MessageSquare, BookOpen, Home, Navigation, CheckCircle, Menu, Mic, X as CloseIcon, ChevronDown, Trophy, BarChart2, Calendar, LayoutDashboard, Globe, Eye, EyeOff, Type, Wifi, WifiOff, Heart, Flag, Users } from 'lucide-react'
import MapScreen from './components/MapScreen'
import FeedScreen from './components/FeedScreen'
import AddSevaModal from './components/AddSevaModal'
import SevaDetailsSheet from './components/SevaDetailsSheet'
import FilterBar from './components/FilterBar'
import AuthModal from './components/AuthModal'
import StatCounter from './components/StatCounter'
import HostDashboard from './components/HostDashboard'
import Leaderboard from './components/Leaderboard'
import AnalyticsDashboard from './components/AnalyticsDashboard'
import EventCalendar from './components/EventCalendar'
import VolunteerNetwork from './components/VolunteerNetwork'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LangProvider, useLang } from './context/LangContext'
import { AppProvider, useApp } from './context/AppContext'
import { getSevas, createSeva, updateSeva } from './services/SevaService'
import useSevaRealtime from './hooks/useSevaRealtime'

const CITIES = ['Delhi', 'Mumbai', 'Kolkata', 'Amritsar', 'Jaipur', 'Varanasi', 'Hyderabad', 'Chennai', 'Bengaluru', 'Pune']

function AppContent() {
  const [currentPage, setCurrentPage] = useState('home')
  const [view, setView] = useState('map')
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const [isFestivalMode, setIsFestivalMode] = useState(false)
  const [heroImageStatus, setHeroImageStatus] = useState('loading')
  const [isScrolled, setIsScrolled] = useState(false)
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('Listening...')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedSeva, setSelectedSeva] = useState(null)
  const [sevas, setSevas] = useState([])
  const [loadingSevas, setLoadingSevas] = useState(true)
  const [activeFilter, setActiveFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('All')
  const [nowFilter, setNowFilter] = useState('all') // 'all' | 'now' | 'upcoming'
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [toasts, setToasts] = useState([])
  const [activeFaq, setActiveFaq] = useState(null)
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [showCitySwitcher, setShowCitySwitcher] = useState(false)
  const [mapCenterOverride, setMapCenterOverride] = useState(null)

  const { user, signOut } = useAuth()
  const { t, lang, switchLang } = useLang()
  const { toggleSaved, isSaved, accessibilityMode, toggleLargeText, toggleLowBandwidth, selectedCity, changeCity } = useApp()

  // Register PWA service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        console.log('SW registered:', reg.scope)
      }).catch(err => console.log('SW registration failed:', err))
    }
    // Add manifest link
    const link = document.querySelector('link[rel="manifest"]') || document.createElement('link')
    link.rel = 'manifest'; link.href = '/manifest.json'
    document.head.appendChild(link)
  }, [])

  // Handle URL-based deep links (?page=app&sevaId=123)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const page = params.get('page')
    const sevaId = params.get('sevaId')
    const addParam = params.get('add')
    if (page) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentPage(page)
    }
    if (addParam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAddModalOpen(true)
    }
    if (sevaId) {
      // Will select the seva once loaded
      const tid = setInterval(() => {
        setSevas(prev => {
          const target = prev.find(s => String(s.id) === sevaId)
          if (target) { setSelectedSeva(target); clearInterval(tid) }
          return prev
        })
      }, 500)
    }
  }, [])

  // Load sevas
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingSevas(true)
    getSevas(selectedCity !== 'All' ? selectedCity : null).then(data => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSevas(data); 
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoadingSevas(false)
    })
  }, [selectedCity])

  // Supabase Realtime
  const handleRealtimeInsert = useCallback((newSeva) => {
    setSevas(prev => prev.find(s => s.id === newSeva.id) ? prev : [newSeva, ...prev])
  }, [])
  const handleRealtimeUpdate = useCallback((updated) => {
    setSevas(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s))
  }, [])
  useSevaRealtime({ onInsert: handleRealtimeInsert, onUpdate: handleRealtimeUpdate })

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Moving vans
  useEffect(() => {
    const interval = setInterval(() => {
      setSevas(prev => prev.map(s => s.isMoving && s.isLive && s.status !== 'finished'
        ? { ...s, location: { lat: s.location.lat + (Math.random() - 0.5) * 0.00015, lng: s.location.lng + (Math.random() - 0.5) * 0.00015 } }
        : s))
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const addToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }

  const handleAddSevaClick = () => {
    if (!user) { addToast('Please login to list a Seva!', 'warning'); setIsAuthModalOpen(true) }
    else setIsAddModalOpen(true)
  }

  const handleAddSeva = async (newSeva) => {
    const created = await createSeva({ ...newSeva, isLive: true, distance: 'Near you', trustScore: 100, userId: user?.id, city: selectedCity })
    setSevas(prev => [created, ...prev])
    setIsAddModalOpen(false)
    addToast('Seva published and live! 🎉')
  }

  const handleLogout = async () => {
    await signOut(); setIsProfileDropdownOpen(false); addToast('Logged out.')
  }

  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) { addToast('Notifications not supported in this browser.', 'warning'); return }
    if (Notification.permission === 'granted') { addToast('Notifications already enabled! ✅'); return }
    const perm = await Notification.requestPermission()
    if (perm === 'granted') {
      addToast('Notifications enabled! 🔔')
      new Notification('BhojanSeva', { body: "You'll now get alerts for nearby Sevas!", icon: '/favicon.svg' })
    } else { addToast('Notification permission denied.', 'warning') }
  }

  const handleContactSubmit = (e) => {
    e.preventDefault()
    addToast('Message sent! Thank you 🙏')
    setContactForm({ name: '', email: '', subject: '', message: '' })
  }

  const triggerVoiceSearch = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { addToast('Voice search not supported. Use Chrome/Edge.', 'warning'); return }
    setIsVoiceModalOpen(true); setVoiceTranscript('Listening... speak now')
    const r = new SR(); r.lang = 'hi-IN'; r.interimResults = false; r.maxAlternatives = 1
    r.onresult = (e) => {
      const text = e.results[0][0].transcript
      setVoiceTranscript(`"${text}"`)
      setTimeout(() => { setIsVoiceModalOpen(false); processVoiceQuery(text) }, 1000)
    }
    r.onerror = () => { setVoiceTranscript('Error. Try again.'); setTimeout(() => setIsVoiceModalOpen(false), 1500) }
    r.start()
  }

  const processVoiceQuery = (text) => {
    const q = text.toLowerCase()
    if (q.includes('langar') || q.includes('लंगर')) { setActiveFilter('Langar'); addToast('Voice: Langar filter applied 🕌') }
    else if (q.includes('bhandara') || q.includes('भंडारा')) { setActiveFilter('Bhandara'); addToast('Voice: Bhandara filter 🍛') }
    else if (q.includes('prasad') || q.includes('प्रसाद')) { setActiveFilter('Prasad'); addToast('Voice: Prasad filter 🙏') }
    else if (q.includes('jain') || q.includes('जैन')) { setSearchQuery('Jain'); addToast('Voice: Jain filter 🍃') }
    else if (q.includes('water') || q.includes('पानी')) { setSearchQuery('Water'); addToast('Voice: Water filter 💧') }
    else { setSearchQuery(text); addToast(`Voice: Searched "${text}"`) }
  }

  const filteredSevas = sevas.filter(s => {
    const mf = activeFilter === 'All' || s.type === activeFilter
    const ms = !searchQuery.trim() || searchQuery === 'All' || s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.food.toLowerCase().includes(searchQuery.toLowerCase()) || (s.tags && s.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
    const mSaved = activeFilter === 'Saved' ? isSaved(s.id) : true
    const mNow = nowFilter === 'all' ? true : nowFilter === 'now' ? (s.isLive && s.status !== 'finished') : (!s.isLive || s.status === 'finished')
    return mf && ms && mSaved && mNow
  })

  const navTo = (page) => { setCurrentPage(page); setIsMobileMenuOpen(false); setIsProfileDropdownOpen(false) }

  const handleGeocodeSearch = async (query) => {
    setSearchQuery(query)
    if (query.length > 3) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data && data.length > 0) {
          setMapCenterOverride([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
          addToast(`📍 Location found: ${data[0].display_name.split(',')[0]}`);
        }
      } catch (err) { console.error('Geocoding error', err) }
    }
  }

  const navItems = [
    ['home', t('home'), <Home size={15} />],
    ['app', t('findSeva'), <Map size={15} />],
    ['calendar', t('analytics'), <Calendar size={15} />],
    ['leaderboard', 'Leaderboard', <Trophy size={15} />],
    ['analytics', 'Analytics', <BarChart2 size={15} />],
    ['network', 'NGO Network', <Users size={15} />],
    ['about', t('about'), <Info size={15} />],
    ['guidelines', t('guidelines'), <BookOpen size={15} />],
    ['contact', t('contact'), <MessageSquare size={15} />],
    ['csr', 'Sponsor', <Heart size={15} />],
  ]

  const handleShareApp = () => {
    const url = `${window.location.origin}/?page=app`
    if (navigator.share) navigator.share({ title: 'BhojanSeva', text: 'Find free food near you!', url })
    else { navigator.clipboard.writeText(url); addToast('Link copied to clipboard!') }
  }

  return (
    <div className={`app-container${accessibilityMode.largeText ? ' large-text' : ''}${accessibilityMode.lowBandwidth ? ' low-bandwidth' : ''}`}>
      {/* Toast container */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast" style={{ background: t.type === 'warning' ? '#D97706' : t.type === 'danger' ? 'var(--color-danger)' : 'var(--color-text-primary)' }}>
            {t.type === 'success' ? <CheckCircle size={15} color="var(--color-success)" /> : '⚠️'}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Voice modal */}
      {isVoiceModalOpen && (
        <div className="voice-modal-overlay">
          <div className="voice-modal">
            <div className="voice-mic-circle"><Mic size={34} /></div>
            <h3 style={{ margin: 0 }}>Vernacular Voice Search</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0 }}>Hindi, English, Punjabi...</p>
            <div className="voice-transcript">{voiceTranscript}</div>
            <button onClick={() => setIsVoiceModalOpen(false)} className="btn btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`glass-floating-bar${isScrolled ? ' scrolled' : ''}`} style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, padding: '0 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button aria-label="Open Menu" className="hamburger-button" onClick={() => setIsMobileMenuOpen(true)}><Menu size={22} /></button>
          <div onClick={() => navTo('home')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }} aria-label="Go to Home">
            <span style={{ fontSize: '1.65rem' }}>🍛</span>
            <span className="text-saffron" style={{ fontSize: '1.15rem', fontWeight: 900, letterSpacing: '-0.02em' }}>BhojanSeva</span>
          </div>

          {/* City switcher */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowCitySwitcher(!showCitySwitcher)} style={{ background: 'rgba(255,153,51,0.08)', border: '1px solid rgba(255,153,51,0.2)', borderRadius: 'var(--radius-full)', padding: '0.25rem 0.625rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontFamily: 'inherit' }}>
              <Globe size={12} /> {selectedCity} <ChevronDown size={10} />
            </button>
            {showCitySwitcher && (
              <div className="glass-deep" style={{ position: 'absolute', top: '38px', left: 0, width: '160px', padding: '0.5rem', borderRadius: 'var(--radius-lg)', zIndex: 1100, animation: 'fadeIn 0.2s ease-out' }}>
                {CITIES.map(city => (
                  <button key={city} onClick={() => { changeCity(city); setShowCitySwitcher(false) }}
                    className="dropdown-item" style={{ fontSize: '0.8rem', fontWeight: selectedCity === city ? 700 : 500, color: selectedCity === city ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
                    {selectedCity === city ? '✓ ' : ''}{city}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {navItems.slice(0, 5).map(([page, label, icon]) => (
            <button key={page} onClick={() => navTo(page)} className={`nav-link${currentPage === page ? ' active' : ''}`} style={{ fontSize: '0.82rem' }}>
              {icon} {label}
            </button>
          ))}
        </nav>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* Language switcher */}
          <button onClick={() => switchLang(lang === 'en' ? 'hi' : 'en')} title="Switch Language" style={{ background: 'rgba(255,153,51,0.07)', border: '1px solid rgba(255,153,51,0.15)', borderRadius: 'var(--radius-full)', padding: '0.25rem 0.625rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', cursor: 'pointer', fontFamily: 'inherit' }}>
            {lang === 'en' ? 'हि' : 'EN'}
          </button>

          {/* Accessibility toggles */}
          <button onClick={toggleLargeText} title="Large Text" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.4rem', color: accessibilityMode.largeText ? 'var(--color-primary)' : 'var(--color-text-secondary)', borderRadius: 'var(--radius-md)', transition: 'color 0.15s' }}>
            <Type size={17} />
          </button>
          <button onClick={toggleLowBandwidth} title="Low Bandwidth Mode" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.4rem', color: accessibilityMode.lowBandwidth ? 'var(--color-warning)' : 'var(--color-text-secondary)', borderRadius: 'var(--radius-md)', transition: 'color 0.15s' }}>
            {accessibilityMode.lowBandwidth ? <WifiOff size={17} /> : <Wifi size={17} />}
          </button>
          <button onClick={handleEnableNotifications} title="Notifications" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.4rem', color: 'var(--color-text-secondary)', borderRadius: 'var(--radius-md)', transition: 'background 0.15s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'} onMouseOut={e => e.currentTarget.style.background = 'none'}>
            <Bell size={18} />
          </button>

          {user ? (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', border: 'none', cursor: 'pointer', padding: '0.2rem 0.6rem 0.2rem 0.2rem', borderRadius: '2rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'white', fontWeight: 700, boxShadow: '0 2px 8px rgba(255,153,51,0.4)', fontFamily: 'inherit' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                  {user.user_metadata?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <ChevronDown size={12} />
              </button>

              {isProfileDropdownOpen && (
                <div className="glass-deep" style={{ position: 'absolute', top: '52px', right: 0, width: '230px', padding: '1rem', borderRadius: 'var(--radius-lg)', zIndex: 1100, animation: 'fadeIn 0.2s ease-out' }}>
                  <div style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{user.user_metadata?.name || 'Member'}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '0.1rem' }}>{user.email}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <button onClick={() => { navTo('dashboard'); setIsProfileDropdownOpen(false) }} className="dropdown-item"><LayoutDashboard size={14} /> My Dashboard</button>
                    <button onClick={() => { navTo('leaderboard'); setIsProfileDropdownOpen(false) }} className="dropdown-item"><Trophy size={14} /> Leaderboard</button>
                    <button onClick={() => { navTo('guidelines'); setIsProfileDropdownOpen(false) }} className="dropdown-item"><BookOpen size={14} /> Guidelines</button>
                    <button onClick={handleShareApp} className="dropdown-item">🔗 Share App</button>
                    <button onClick={handleLogout} className="btn btn-primary" style={{ width: '100%', padding: '0.55rem', fontSize: '0.82rem', marginTop: '0.5rem', borderRadius: 'var(--radius-md)' }}>{t('logout')}</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => setIsAuthModalOpen(true)} className="btn btn-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}>{t('login')}</button>
          )}
        </div>
      </header>

      {/* Mobile drawer */}
      {isMobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="mobile-drawer" onClick={e => e.stopPropagation()}>
            <button className="mobile-drawer-close" onClick={() => setIsMobileMenuOpen(false)}><CloseIcon size={20} /></button>
            <div style={{ textAlign: 'center', fontSize: '1.25rem' }}>🍛 <span className="text-saffron" style={{ fontWeight: 900 }}>BhojanSeva</span></div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <button onClick={() => switchLang(lang === 'en' ? 'hi' : 'en')} style={{ background: 'rgba(255,153,51,0.1)', border: '1px solid rgba(255,153,51,0.2)', borderRadius: 'var(--radius-full)', padding: '0.3rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', cursor: 'pointer', fontFamily: 'inherit' }}>
                {lang === 'en' ? 'हिन्दी' : 'English'}
              </button>
            </div>
            <div className="mobile-drawer-links">
              {navItems.map(([page, label, icon]) => (
                <button key={page} className={`mobile-drawer-link${currentPage === page ? ' active' : ''}`} onClick={() => navTo(page)}>
                  {icon} {label}
                </button>
              ))}
              {user && <button className="mobile-drawer-link" onClick={() => navTo('dashboard')}><LayoutDashboard size={18} /> My Dashboard</button>}
            </div>
          </div>
        </div>
      )}

      <main className="main-content">

        {/* ══════ HOME PAGE ══════ */}
        {currentPage === 'home' && (
          <div className="scrollable-page">
            <div className="scrollable-page-content" style={{ animation: 'fadeIn 0.4s ease-out' }}>

              {/* Hero */}
              <div className="hero-section hero-bg" style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1.2fr 0.8fr' : '1fr', gap: '2.5rem', alignItems: 'center', borderRadius: 'var(--radius-2xl)', marginBottom: '3rem' }}>
                <div className="blob blob-1" /><div className="blob blob-2" /><div className="blob blob-3" />
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <div className="hero-badge"><span className="live-dot" /> {t('tagline')}</div>
                  <h1 className="hero-title" style={{ marginBottom: '1rem' }}>{t('tagline')}</h1>
                  <p className="hero-subtitle" style={{ marginBottom: '2rem' }}>
                    Find free Bhandaras, Langars, Prasad stalls & Iftar camps near you — in real-time. Or add an active food camp to help others.
                  </p>
                  <div className="hero-actions">
                    <button onClick={() => navTo('app')} className="btn btn-primary" style={{ padding: '0.9rem 2rem', fontSize: '1.05rem' }}>
                      <Navigation size={17} /> {t('findFood')}
                    </button>
                    <button onClick={handleAddSevaClick} className="btn btn-secondary-saffron" style={{ padding: '0.9rem 2rem', fontSize: '1.05rem' }}>
                      <Plus size={17} /> {t('addSeva')}
                    </button>
                  </div>
                </div>
                {isDesktop && (
                  <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'center', minHeight: '260px', alignItems: 'center' }}>
                    {heroImageStatus === 'loading' && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(255,153,51,0.08) 25%, rgba(255,153,51,0.15) 50%, rgba(255,153,51,0.08) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite linear', borderRadius: 'var(--radius-xl)', minHeight: '220px', width: '100%' }} />}
                    {heroImageStatus === 'error' && <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,153,51,0.06)', borderRadius: 'var(--radius-xl)', padding: '2.5rem', width: '100%', minHeight: '220px', border: '1px solid rgba(255,153,51,0.15)', textAlign: 'center' }}><span style={{ fontSize: '3.5rem' }}>🍲</span><h4 style={{ marginTop: '0.75rem' }}>Sharing is Caring</h4></div>}
                    <img src="/community_feeding_illustration.png" alt="Community Feeding" onLoad={() => setHeroImageStatus('loaded')} onError={() => setHeroImageStatus('error')} style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)', border: '1px solid rgba(255,153,51,0.15)', display: heroImageStatus === 'loaded' ? 'block' : 'none', objectFit: 'cover' }} />
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="stats-grid">
                {[
                  { num: '45', suffix: '+', label: 'Active Sevas Today', desc: 'Live right now across the city' },
                  { num: '12', suffix: 'k+', label: 'Meals Tracked', desc: 'Community-guided meals served' },
                  { num: '98', suffix: '%', label: 'Trust Score', desc: 'Crowd-verified accuracy' },
                ].map(({ num, suffix, label, desc }) => (
                  <div key={label} className="stat-card">
                    <div className="stat-number"><StatCounter target={num} suffix={suffix} /></div>
                    <div className="stat-label">{label}</div>
                    <div className="stat-desc">{desc}</div>
                  </div>
                ))}
              </div>

              {/* Quick nav grid */}
              <div style={{ marginBottom: '4rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <h2 className="section-title">Explore BhojanSeva</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  {[
                    { icon: '🗺️', label: 'Live Map', desc: 'Find active camps near you', page: 'app' },
                    { icon: '📅', label: 'Seva Calendar', desc: 'Upcoming festivals & events', page: 'calendar' },
                    { icon: '🏆', label: 'Leaderboard', desc: 'Top community contributors', page: 'leaderboard' },
                    { icon: '📊', label: 'Impact Data', desc: 'Meals served, waste saved', page: 'analytics' },
                    { icon: '💰', label: 'Sponsor a Seva', desc: 'Fund community kitchens', page: 'csr' },
                    { icon: '🏠', label: 'Host Dashboard', desc: 'Manage your listings', page: 'dashboard' },
                  ].map(({ icon, label, desc, page }) => (
                    <div key={page} onClick={() => navTo(page)}
                      style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)', cursor: 'pointer', border: '1px solid rgba(0,0,0,0.04)', transition: 'transform 0.2s, box-shadow 0.2s', textAlign: 'center' }}
                      onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
                      onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.625rem' }}>{icon}</div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.3rem' }}>{label}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div style={{ marginBottom: '4rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}><h2 className="section-title">How It Works</h2></div>
                <div className="features-grid">
                  {[
                    { icon: <Map size={22} />, step: '1', title: 'Find Camps Near You', text: 'Browse the live map or feed. Filter by meal type, dietary tag, or use Hindi voice search.' },
                    { icon: <Navigation size={22} />, step: '2', title: 'Navigate & Go', text: 'One click opens Google Maps. Festival Route Mode draws an optimized multi-stop path.' },
                    { icon: <CheckCircle size={22} />, step: '3', title: 'Verify & Protect', text: 'Crowd-vote status updates. Three "Finished" reports in 10 min auto-grays the pin.' },
                  ].map(({ icon, step, title, text }) => (
                    <div key={step} className="feature-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                        <div className="feature-icon-wrapper">{icon}</div>
                        <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900, flexShrink: 0 }}>{step}</div>
                      </div>
                      <h3 style={{ fontSize: '1.1rem' }}>{title}</h3>
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════ FIND SEVA (APP) ══════ */}
        {currentPage === 'app' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingTop: '64px' }}>
            <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} searchQuery={searchQuery === 'All' ? '' : searchQuery} onSearchChange={handleGeocodeSearch} nowFilter={nowFilter} onNowFilterChange={setNowFilter} />
            <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
              {isDesktop ? (
                <div className="split-app-container">
                  <div className="split-map-pane">
                    <MapScreen sevas={filteredSevas} onSelectSeva={setSelectedSeva} isFestivalMode={isFestivalMode} onTriggerVoiceSearch={triggerVoiceSearch} centerOverride={mapCenterOverride} />
                    <div className="glass-panel" style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', zIndex: 900, padding: '0.6rem 1rem', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>🎪 {t('festivalMode')}</span>
                      <input type="checkbox" aria-label="Toggle Festival Mode" checked={isFestivalMode} onChange={e => setIsFestivalMode(e.target.checked)} style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: 'var(--color-primary)' }} />
                    </div>
                  </div>
                  <div className="split-feed-pane">
                    {loadingSevas ? <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>Loading camps...</div>
                      : <FeedScreen sevas={filteredSevas} onSelectSeva={setSelectedSeva} />}
                  </div>
                </div>
              ) : (
                <>
                  {view === 'map' ? <MapScreen sevas={filteredSevas} onSelectSeva={setSelectedSeva} isFestivalMode={isFestivalMode} onTriggerVoiceSearch={triggerVoiceSearch} centerOverride={mapCenterOverride} />
                    : <FeedScreen sevas={filteredSevas} onSelectSeva={setSelectedSeva} />}
                  {view === 'map' && (
                    <div className="glass-panel" style={{ position: 'absolute', bottom: '5.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 900, padding: '0.4rem 0.875rem', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>🎪 Festival Mode</span>
                      <input type="checkbox" aria-label="Toggle Festival Mode" checked={isFestivalMode} onChange={e => setIsFestivalMode(e.target.checked)} style={{ width: '13px', height: '13px', cursor: 'pointer', accentColor: 'var(--color-primary)' }} />
                    </div>
                  )}
                  <div className="glass-panel" style={{ position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 900, display: 'flex', borderRadius: '2rem', padding: '0.2rem', boxShadow: 'var(--shadow-lg)' }}>
                    {[['map', <Map size={15} />, 'Map'], ['feed', <List size={15} />, 'Feed']].map(([v, icon, label]) => (
                      <button key={v} onClick={() => setView(v)} className="btn" style={{ padding: '0.4rem 1rem', borderRadius: '2rem', fontSize: '0.825rem', background: view === v ? 'var(--color-primary)' : 'transparent', color: view === v ? 'white' : 'var(--color-text-primary)', border: 'none', gap: '0.3rem' }}>
                        {icon} {label}
                      </button>
                    ))}
                  </div>
                </>
              )}
              <button className="fab" onClick={handleAddSevaClick}><Plus size={22} /></button>
            </div>
          </div>
        )}

        {/* ══════ INNER PAGES ══════ */}
        {['calendar', 'leaderboard', 'analytics', 'about', 'network', 'guidelines', 'contact', 'dashboard', 'csr'].includes(currentPage) && (
          <div className="scrollable-page">
            <div className="scrollable-page-content" style={{ animation: 'fadeIn 0.4s ease-out' }}>

              {currentPage === 'calendar' && <EventCalendar sevas={sevas} />}
              {currentPage === 'leaderboard' && <Leaderboard />}
              {currentPage === 'analytics' && <AnalyticsDashboard />}
              {currentPage === 'network' && <VolunteerNetwork />}
              {currentPage === 'dashboard' && <HostDashboard onAddSeva={handleAddSevaClick} onSelectSeva={setSelectedSeva} />}

              {currentPage === 'about' && (
                <>
                  <div className="about-header">
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Our Mission & Ethos</h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', maxWidth: '620px', margin: '0 auto' }}>BhojanSeva is a non-profit, volunteer-driven platform inspired by the sacred Indian tradition of selfless sharing — <em>Seva</em>.</p>
                  </div>
                  <div className="about-row">
                    <div className="about-content">
                      <h2 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>Rooted in Tradition,<br />Powered by Technology</h2>
                      <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: '1.5rem' }}>For centuries, Langars and Bhandaras have fed millions in India. BhojanSeva digitizes these sacred camps in real-time so no one goes hungry.</p>
                      <div className="timeline">
                        {[
                          { title: 'Community Listing', text: 'Organizers pin active camps with food details, dietary tags, and live status.' },
                          { title: 'Real-Time Map', text: 'Seekers browse the live map filtered by meal type, distance, or voice search.' },
                          { title: 'Crowd Verification', text: 'Community votes ensure accuracy — outdated pins are automatically grayed out.' },
                          { title: 'Seva SOS', text: 'Organizers with surplus food trigger an SOS to connect with nearby NGOs instantly.' },
                        ].map(({ title, text }) => (
                          <div key={title} className="timeline-item">
                            <div className="timeline-dot" /><div className="timeline-content"><h4>{title}</h4><p>{text}</p></div>
                          </div>
                        ))}
                      </div>
                      <div className="about-card-grid">
                        <div className="about-subcard"><h4 style={{ marginBottom: '0.5rem' }}>100% Free</h4><p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>All listed food camps are strictly free. No registration to view the map.</p></div>
                        <div className="about-subcard"><h4 style={{ marginBottom: '0.5rem' }}>Crowd-Verified</h4><p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>Updates validated by community upvotes, ensuring high accuracy.</p></div>
                      </div>
                    </div>
                    <div className="about-image-mock" style={{ minHeight: '420px' }}>
                      <img src="/langar_hall.png" alt="Community Langar Hall" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-xl)' }} onError={e => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:1rem;padding:2rem"><span style="font-size:5rem">🤝</span><h3>Community Strength</h3></div>' }} />
                    </div>
                  </div>
                </>
              )}

              {currentPage === 'guidelines' && (
                <>
                  <h1 style={{ fontSize: '2.25rem', marginBottom: '0.75rem', textAlign: 'center' }}>Community Standards</h1>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', textAlign: 'center', maxWidth: '620px', margin: '0 auto 3rem' }}>Help us keep BhojanSeva a clean, respectful, and reliable resource for everyone.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: '2rem', marginBottom: '4rem' }}>
                    {[
                      { label: '🍛 For Seekers', color: 'var(--color-primary)', rules: ['Form an orderly line and wait for your turn', 'Avoid food waste — take only what you can finish', 'Dispose of packaging in provided bins', 'Be respectful to the volunteers serving you'] },
                      { label: '🧡 For Organizers', color: 'var(--color-success)', rules: ['Pin exact coordinates and set end time', 'Provide clean drinking water if possible', 'Maintain clean surroundings during distribution', 'Mark Seva as "Finished" once food is done'] },
                    ].map(({ label, color, rules }) => (
                      <div key={label} style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', borderLeft: `4px solid ${color}` }}>
                        <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>{label}</h3>
                        <ul style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.9, paddingLeft: '1.25rem' }}>{rules.map(r => <li key={r}>{r}</li>)}</ul>
                      </div>
                    ))}
                  </div>
                  <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', textAlign: 'center' }}>Frequently Asked Questions</h2>
                  <div className="faq-list">
                    {[
                      { q: 'Is the food really free?', a: 'Yes. All food camps on BhojanSeva are 100% free — hosted by spiritual organizations, volunteers, or charitable donors.' },
                      { q: 'How do I submit a Bhandara or Langar?', a: 'Login and go to "Find Seva", then click the orange (+) FAB button. Your GPS coordinates are auto-detected.' },
                      { q: 'What is the Trust Score?', a: 'Credibility score based on community upvotes/downvotes. High scores rank higher in the feed.' },
                      { q: 'How do I report an expired listing?', a: 'Open listing details → Status Meter → "Finished". Three reports within 10 minutes auto-grays the pin.' },
                      { q: 'Can I become a Verified Organizer?', a: 'Yes! Contact us with your NGO/temple registration. We review and grant a blue ✓ badge within 48 hours.' },
                    ].map((faq, i) => (
                      <div key={i} className="faq-item">
                        <button onClick={() => setActiveFaq(activeFaq === i ? null : i)} className="faq-question-btn">
                          <span>{faq.q}</span><span style={{ fontSize: '1.2rem', color: 'var(--color-primary)' }}>{activeFaq === i ? '−' : '+'}</span>
                        </button>
                        {activeFaq === i && <div className="faq-answer">{faq.a}</div>}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {currentPage === 'contact' && (
                <>
                  <h1 style={{ fontSize: '2.25rem', marginBottom: '0.75rem', textAlign: 'center' }}>Get In Touch</h1>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', textAlign: 'center', maxWidth: '580px', margin: '0 auto 3rem' }}>Suggestions, questions, or report incorrect listings?</p>
                  <div className="contact-container">
                    <div className="contact-info">
                      <div className="contact-card">
                        <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>BhojanSeva Org</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: '1rem' }}>We build tech solutions for community welfare. Reach out to collaborate!</p>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.9 }}>📍 New Delhi, India<br />📧 contact@bhojanseva.org<br />🕐 Mon–Sat, 10am–7pm IST</div>
                      </div>
                      <div className="contact-card" style={{ background: 'linear-gradient(135deg, rgba(255,153,51,0.08), rgba(255,249,245,1))', border: '1px solid rgba(255,153,51,0.15)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🙏</div>
                        <h4 style={{ marginBottom: '0.5rem' }}>Volunteer With Us</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>Help moderate listings or expand BhojanSeva to your city!</p>
                      </div>
                    </div>
                    <div className="contact-card">
                      <form onSubmit={handleContactSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div className="form-group"><label>Name</label><input type="text" required value={contactForm.name} onChange={e => setContactForm({ ...contactForm, name: e.target.value })} placeholder="Your Name" className="form-input" /></div>
                          <div className="form-group"><label>Email</label><input type="email" required value={contactForm.email} onChange={e => setContactForm({ ...contactForm, email: e.target.value })} placeholder="you@example.com" className="form-input" /></div>
                        </div>
                        <div className="form-group"><label>Subject</label><input type="text" required value={contactForm.subject} onChange={e => setContactForm({ ...contactForm, subject: e.target.value })} placeholder="Feedback or Report" className="form-input" /></div>
                        <div className="form-group"><label>Message</label><textarea rows="5" required value={contactForm.message} onChange={e => setContactForm({ ...contactForm, message: e.target.value })} placeholder="Details..." className="form-textarea" /></div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem' }}>Send Message 🚀</button>
                      </form>
                    </div>
                  </div>
                </>
              )}

              {currentPage === 'csr' && (
                <>
                  <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💰 Sponsor a Seva</h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', maxWidth: '580px', margin: '0 auto' }}>Support free community kitchens. Your donation funds meals for hundreds — and is displayed proudly on the listing.</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr 1fr' : '1fr', gap: '1.5rem', marginBottom: '3rem' }}>
                    {[
                      { amt: '₹500', meals: '~50', badge: '🌱 Seed Donor', color: '#10B981' },
                      { amt: '₹2,000', meals: '~200', badge: '⭐ Silver Sponsor', color: '#6366F1' },
                      { amt: '₹10,000', meals: '~1,000', badge: '🏅 Gold Sponsor', color: '#F59E0B' },
                    ].map(({ amt, meals, badge, color }) => (
                      <div key={badge} style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', padding: '2.5rem 2rem', textAlign: 'center', boxShadow: 'var(--shadow-md)', border: `2px solid ${color}20`, position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: color }} />
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color, marginBottom: '0.5rem' }}>{amt}</div>
                        <div style={{ background: `${color}15`, color, display: 'inline-block', padding: '0.25rem 0.875rem', borderRadius: '2rem', fontWeight: 700, fontSize: '0.85rem', marginBottom: '1rem' }}>{badge}</div>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Funds approximately <strong>{meals} meals</strong>. Your name/logo appears on the sponsored Seva pin.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { window.open(`upi://pay?pa=bhojanseva@upi&pn=BhojanSeva&am=${amt.replace('₹','')}&cu=INR`, '_blank'); addToast(`Opening UPI for ${amt} donation...`) }}>
                            Donate {amt} via UPI
                          </button>
                          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=upi://pay?pa=bhojanseva@upi&pn=BhojanSeva&am=${amt.replace('₹','')}&cu=INR`} alt={`Donate ${amt} QR`} style={{ borderRadius: 'var(--radius-md)', border: `2px solid ${color}40`, padding: '0.25rem', background: 'white' }} />
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Scan with any UPI App</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', padding: '2.5rem', boxShadow: 'var(--shadow-sm)', marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>🏢 Corporate CSR Program</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: '2rem', alignItems: 'start' }}>
                      <div>
                        <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: '1.25rem' }}>Partner with BhojanSeva for your company's CSR mandate. Receive verified impact reports suitable for regulatory compliance and annual reports.</p>
                        <ul style={{ color: 'var(--color-text-secondary)', lineHeight: 2, paddingLeft: '1.25rem' }}>
                          <li>Company logo on all sponsored pins</li>
                          <li>Monthly PDF impact report (meals, people served, CO₂ saved)</li>
                          <li>Verified NGO receipt for CSR filing</li>
                          <li>Dedicated CSR dashboard with real-time data</li>
                        </ul>
                      </div>
                      <div style={{ background: 'var(--color-bg)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,153,51,0.15)' }}>
                        <h4 style={{ marginBottom: '1rem' }}>Request Partnership</h4>
                        <div className="form-group"><label>Company Name</label><input type="text" placeholder="Acme Corp" className="form-input" /></div>
                        <div className="form-group"><label>Monthly Budget</label><input type="text" placeholder="₹50,000/month" className="form-input" /></div>
                        <div className="form-group"><label>Contact Email</label><input type="email" placeholder="csr@company.com" className="form-input" /></div>
                        <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => addToast('Partnership request submitted! We\'ll contact you within 48 hours.')}>Submit CSR Request</button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '1rem 1.5rem', background: 'var(--color-surface)', borderTop: '1px solid rgba(0,0,0,0.05)', fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
        <span>🍛</span>
        <span>© {new Date().getFullYear()} BhojanSeva — All meals shared are 100% free of cost</span>
        <span>•</span>
        <button onClick={handleShareApp} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.78rem', fontFamily: 'inherit' }}>Share App 🔗</button>
      </footer>

      {/* Modals */}
      {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} />}
      {isAddModalOpen && <AddSevaModal onClose={() => setIsAddModalOpen(false)} onSubmit={handleAddSeva} />}
      {selectedSeva && <SevaDetailsSheet seva={selectedSeva} onClose={() => setSelectedSeva(null)} onUpdateSeva={async (updated) => { await updateSeva(updated.id, updated); setSevas(prev => prev.map(s => s.id === updated.id ? updated : s)); setSelectedSeva(updated) }} />}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <LangProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </LangProvider>
    </AuthProvider>
  )
}
