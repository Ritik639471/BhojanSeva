import { supabase, isMockBackend } from '../lib/supabase';

// ─── Browser fingerprint (no login required for votes/going) ─────────────────
export const getBrowserFingerprint = () => {
  let fp = localStorage.getItem('bhojan_fp');
  if (!fp) {
    fp = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('bhojan_fp', fp);
  }
  return fp;
};

// ─── Seed data (local fallback) ────────────────────────────────────────────────
const SEED_DATA = [
  {
    id: 1, title: 'Gurudwara Bangla Sahib Langar', food: 'Dal Makhani, Roti, Rice, Kheer',
    type: 'Langar', permanence: 'permanent', isLive: true, status: 'serving', isSOS: false,
    tags: ['Full Meal', 'Jain'], allergens: ['Dairy'], finishedVotes: [],
    location: { lat: 28.6264, lng: 77.2091 }, distance: '1.2 km away',
    time: 'Daily: 11:00 AM - 9:00 PM', estimatedServings: 2000, servingsLeft: 1800,
    goingCount: 47, trustScore: 98, isMoving: false, isVerified: true, city: 'Delhi',
    photoUrl: null, photoUrls: [], sponsorName: null,
    aiDescription: 'A divine community kitchen serving thousands with unlimited wholesome meals prepared with love and devotion.'
  },
  {
    id: 2, title: 'Sunday CP Hanuman Mandir Bhandara', food: 'Puri Chole & Sooji Halwa',
    type: 'Bhandara', permanence: 'temporary', isLive: true, status: 'serving', isSOS: false,
    tags: ['Full Meal'], allergens: [], finishedVotes: [],
    location: { lat: 28.6139, lng: 77.2090 }, distance: '0.8 km away',
    time: 'Sundays: 12:00 PM - 3:00 PM', estimatedServings: 500, servingsLeft: 350,
    goingCount: 23, trustScore: 92, isMoving: false, isVerified: true, city: 'Delhi',
    photoUrl: null, photoUrls: [], sponsorName: null,
    aiDescription: 'Golden fried Puris with spiced Chole and freshly made Sooji Halwa — a beloved Sunday tradition at the heart of Delhi.'
  },
  {
    id: 3, title: 'Mobile Food Van — CP Outer Circle', food: 'Food Packets (Rajma Rice)',
    type: 'Bhandara', permanence: 'temporary', isLive: true, status: 'serving', isSOS: true,
    tags: ['Full Meal', 'Snacks'], allergens: ['Gluten'], finishedVotes: [],
    location: { lat: 28.6310, lng: 77.2180 }, distance: '0.4 km away',
    time: 'Active now', estimatedServings: 200, servingsLeft: 80,
    goingCount: 12, trustScore: 88, isMoving: true, isVerified: false, city: 'Delhi',
    photoUrl: null, photoUrls: [], sponsorName: 'Tata Trusts',
    aiDescription: 'Freshly packed Rajma Chawal meals distributed from a moving van — track the live pin to intercept it near you!'
  },
  {
    id: 4, title: 'Summer Chabeel Water Stand', food: 'Sweet Rose Sherbet & Cold Water',
    type: 'Other', permanence: 'temporary', isLive: true, status: 'serving', isSOS: false,
    tags: ['Drinking Water'], allergens: [], finishedVotes: [],
    location: { lat: 28.6230, lng: 77.2150 }, distance: '0.5 km away',
    time: '10:00 AM - 5:00 PM', estimatedServings: 1000, servingsLeft: 700,
    goingCount: 8, trustScore: 95, isMoving: false, isVerified: false, city: 'Delhi',
    photoUrl: null, photoUrls: [], sponsorName: null,
    aiDescription: 'Cool rose-flavored sherbet and chilled water — a refreshing summer Seva combating the scorching Delhi heat.'
  }
];

const getLocalSevas = () => {
  const data = localStorage.getItem('bhojan_sevas_v2');
  if (!data) { localStorage.setItem('bhojan_sevas_v2', JSON.stringify(SEED_DATA)); return SEED_DATA; }
  return JSON.parse(data);
};
const saveLocalSevas = (list) => localStorage.setItem('bhojan_sevas_v2', JSON.stringify(list));

// ─── Field mappers ─────────────────────────────────────────────────────────────
const dbToApp = (item) => ({
  id: item.id, userId: item.user_id, title: item.title, food: item.food,
  type: item.type, permanence: item.permanence, isLive: item.is_live, status: item.status,
  isSOS: item.is_sos, tags: item.tags || [], allergens: item.allergens || [],
  finishedVotes: item.finished_votes || [], location: item.location, distance: item.distance,
  time: item.time, startTime: item.start_time, endTime: item.end_time,
  estimatedServings: item.estimated_servings || 0, servingsLeft: item.servings_left || 0,
  goingCount: item.going_count || 0, trustScore: item.trust_score || 100,
  isMoving: item.is_moving, isVerified: item.is_verified, isFeatured: item.is_featured,
  photoUrl: item.photo_url, photoUrls: item.photo_urls || [],
  sponsorName: item.sponsor_name, sponsorAmount: item.sponsor_amount,
  city: item.city || 'Delhi', aiDescription: item.ai_description,
  contributionScore: item.contribution_score || 0, createdAt: item.created_at
});

const appToDb = (s) => ({
  user_id: s.userId || null, title: s.title, food: s.food, type: s.type,
  permanence: s.permanence, is_live: s.isLive, status: s.status,
  is_sos: s.isSOS, tags: s.tags || [], allergens: s.allergens || [],
  finished_votes: (s.finishedVotes || []).map(Number),
  location: s.location, distance: s.distance, time: s.time,
  start_time: s.startTime || null, end_time: s.endTime || null,
  estimated_servings: s.estimatedServings || 0, servings_left: s.servingsLeft || 0,
  going_count: s.goingCount || 0, trust_score: s.trustScore || 100,
  is_moving: s.isMoving, is_verified: s.isVerified || false,
  photo_url: s.photoUrl || null, photo_urls: s.photoUrls || [],
  sponsor_name: s.sponsorName || null, sponsor_amount: s.sponsorAmount || 0,
  city: s.city || 'Delhi', ai_description: s.aiDescription || null
});

// ─── CRUD ─────────────────────────────────────────────────────────────────────
export const getSevas = async (cityFilter = null) => {
  if (isMockBackend) return getLocalSevas().filter(s => !cityFilter || s.city === cityFilter);
  try {
    let q = supabase.from('sevas').select('*').eq('is_live', true).order('created_at', { ascending: false });
    if (cityFilter) q = q.eq('city', cityFilter);
    const { data, error } = await q;
    if (error) throw error;
    return data.map(dbToApp);
  } catch (err) {
    console.error('getSevas failed, using local:', err);
    return getLocalSevas();
  }
};

export const getSevasNear = async (lat, lng, radiusKm = 10) => {
  if (isMockBackend) return getLocalSevas();
  try {
    const { data, error } = await supabase.rpc('get_sevas_near', { lat, lng, radius_km: radiusKm });
    if (error) throw error;
    return data.map(dbToApp);
  } catch (err) {
    console.error('getSevasNear failed:', err);
    return getLocalSevas();
  }
};

export const getUserSevas = async (userId) => {
  if (isMockBackend) return getLocalSevas().filter(s => s.userId === userId || !s.userId);
  try {
    const { data, error } = await supabase.from('sevas').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(dbToApp);
  } catch (err) {
    console.error('getUserSevas failed:', err);
    return [];
  }
};

export const createSeva = async (newSeva) => {
  if (isMockBackend) {
    const created = { ...newSeva, id: Date.now(), createdAt: new Date().toISOString() };
    const list = getLocalSevas();
    saveLocalSevas([created, ...list]);
    return created;
  }
  try {
    const { data, error } = await supabase.from('sevas').insert(appToDb(newSeva)).select().single();
    if (error) throw error;
    return dbToApp(data);
  } catch (err) {
    console.error('createSeva failed:', err);
    const created = { ...newSeva, id: Date.now() };
    saveLocalSevas([created, ...getLocalSevas()]);
    return created;
  }
};

export const updateSeva = async (id, updatedFields) => {
  if (isMockBackend) {
    const list = getLocalSevas().map(s => s.id === id ? { ...s, ...updatedFields } : s);
    saveLocalSevas(list);
    return { id, ...updatedFields };
  }
  try {
    const dbFields = {};
    if (updatedFields.title !== undefined) dbFields.title = updatedFields.title;
    if (updatedFields.food !== undefined) dbFields.food = updatedFields.food;
    if (updatedFields.status !== undefined) dbFields.status = updatedFields.status;
    if (updatedFields.isLive !== undefined) dbFields.is_live = updatedFields.isLive;
    if (updatedFields.isSOS !== undefined) dbFields.is_sos = updatedFields.isSOS;
    if (updatedFields.finishedVotes !== undefined) dbFields.finished_votes = (updatedFields.finishedVotes || []).map(Number);
    if (updatedFields.location !== undefined) dbFields.location = updatedFields.location;
    if (updatedFields.goingCount !== undefined) dbFields.going_count = updatedFields.goingCount;
    if (updatedFields.servingsLeft !== undefined) dbFields.servings_left = updatedFields.servingsLeft;
    if (updatedFields.trustScore !== undefined) dbFields.trust_score = updatedFields.trustScore;
    if (updatedFields.photoUrl !== undefined) dbFields.photo_url = updatedFields.photoUrl;
    if (updatedFields.photoUrls !== undefined) dbFields.photo_urls = updatedFields.photoUrls;
    if (updatedFields.sponsorName !== undefined) dbFields.sponsor_name = updatedFields.sponsorName;
    if (updatedFields.sponsorAmount !== undefined) dbFields.sponsor_amount = updatedFields.sponsorAmount;
    if (updatedFields.aiDescription !== undefined) dbFields.ai_description = updatedFields.aiDescription;
    const { data, error } = await supabase.from('sevas').update(dbFields).eq('id', id).select().single();
    if (error) throw error;
    return dbToApp(data);
  } catch (err) {
    console.error('updateSeva failed:', err);
    const list = getLocalSevas().map(s => s.id === id ? { ...s, ...updatedFields } : s);
    saveLocalSevas(list);
    return { id, ...updatedFields };
  }
};

export const deleteSeva = async (id) => {
  if (isMockBackend) {
    saveLocalSevas(getLocalSevas().filter(s => s.id !== id));
    return true;
  }
  try {
    const { error } = await supabase.from('sevas').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('deleteSeva failed:', err);
    return false;
  }
};

// ─── Photo Upload ──────────────────────────────────────────────────────────────
export const uploadSevaPhoto = async (file, sevaId) => {
  if (isMockBackend) return URL.createObjectURL(file);
  try {
    const ext = file.name.split('.').pop();
    const path = `sevas/${sevaId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('seva-photos').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('seva-photos').getPublicUrl(path);
    return publicUrl;
  } catch (err) {
    console.error('uploadSevaPhoto failed:', err);
    return null;
  }
};

// ─── "I'm Going" ──────────────────────────────────────────────────────────────
export const toggleGoing = async (sevaId) => {
  const fp = getBrowserFingerprint();
  const key = `going_${sevaId}`;
  const isGoing = !!localStorage.getItem(key);

  if (isMockBackend) {
    const list = getLocalSevas().map(s => s.id === sevaId
      ? { ...s, goingCount: Math.max(0, (s.goingCount || 0) + (isGoing ? -1 : 1)) } : s);
    saveLocalSevas(list);
    if (isGoing) localStorage.removeItem(key); else localStorage.setItem(key, '1');
    return !isGoing;
  }

  try {
    if (isGoing) {
      await supabase.from('going_tracking').delete().eq('seva_id', sevaId).eq('user_fingerprint', fp);
      await supabase.rpc('decrement_going', { seva_id: sevaId });
      localStorage.removeItem(key);
    } else {
      await supabase.from('going_tracking').insert({ seva_id: sevaId, user_fingerprint: fp });
      await supabase.rpc('increment_going', { seva_id: sevaId });
      localStorage.setItem(key, '1');
    }
    return !isGoing;
  } catch (err) {
    console.error('toggleGoing failed:', err);
    return isGoing;
  }
};

export const isUserGoing = (sevaId) => !!localStorage.getItem(`going_${sevaId}`);

// ─── Reports ──────────────────────────────────────────────────────────────────
export const submitReport = async (sevaId, reason, details = '') => {
  const fp = getBrowserFingerprint();
  if (isMockBackend) { console.log('Report submitted (mock):', { sevaId, reason, details }); return true; }
  try {
    const { error } = await supabase.from('reports').insert({ seva_id: sevaId, reason, details, reporter_fingerprint: fp });
    if (error) throw error;
    await supabase.from('sevas').update({ report_count: supabase.rpc('increment', { x: 1 }) }).eq('id', sevaId);
    return true;
  } catch (err) {
    console.error('submitReport failed:', err);
    return false;
  }
};

// ─── User Profile ──────────────────────────────────────────────────────────────
export const getUserProfile = async (userId) => {
  if (isMockBackend) return {
    id: userId, displayName: 'Mock User', contributionScore: 250,
    sevasAdded: 5, sevasVerified: 12, isVerifiedOrganizer: false, isNgo: false, city: 'Delhi'
  };
  try {
    const { data, error } = await supabase.from('user_profiles').select('*').eq('id', userId).single();
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) {
      const { data: created } = await supabase.from('user_profiles').insert({ id: userId }).select().single();
      return created;
    }
    return {
      id: data.id, displayName: data.display_name, avatarUrl: data.avatar_url,
      city: data.city, contributionScore: data.contribution_score || 0,
      sevasAdded: data.sevas_added || 0, sevasVerified: data.sevas_verified || 0,
      isVerifiedOrganizer: data.is_verified_organizer, isNgo: data.is_ngo, bio: data.bio
    };
  } catch (err) {
    console.error('getUserProfile failed:', err);
    return null;
  }
};

export const getLeaderboard = async (city = null) => {
  if (isMockBackend) return [
    { displayName: 'Aarav Sharma', contributionScore: 450, sevasAdded: 12, city: 'Delhi', isVerifiedOrganizer: true },
    { displayName: 'Pooja Singh', contributionScore: 320, sevasAdded: 8, city: 'Delhi', isVerifiedOrganizer: false },
    { displayName: 'Rahul Gupta', contributionScore: 280, sevasAdded: 6, city: 'Mumbai', isVerifiedOrganizer: false },
    { displayName: 'Priya Nair', contributionScore: 210, sevasAdded: 5, city: 'Delhi', isVerifiedOrganizer: true },
    { displayName: 'Arjun Patel', contributionScore: 180, sevasAdded: 4, city: 'Amritsar', isVerifiedOrganizer: false },
  ];
  try {
    let q = supabase.from('user_profiles').select('*').order('contribution_score', { ascending: false }).limit(20);
    if (city) q = q.eq('city', city);
    const { data, error } = await q;
    if (error) throw error;
    return data.map(d => ({ displayName: d.display_name, contributionScore: d.contribution_score, sevasAdded: d.sevas_added, city: d.city, isVerifiedOrganizer: d.is_verified_organizer }));
  } catch (err) {
    console.error('getLeaderboard failed:', err);
    return [];
  }
};

// ─── AI Description ────────────────────────────────────────────────────────────
export const generateAIDescription = async (food, type) => {
  try {
    const prompt = `Write a warm, appetizing 1-sentence description (max 20 words) for a free community ${type} serving "${food}". No emojis. Make it sound heartfelt and inviting.`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  } catch (err) {
    console.error('AI description failed:', err);
    return null;
  }
};

// ─── Analytics helpers ─────────────────────────────────────────────────────────
export const getAnalytics = async () => {
  if (isMockBackend) return {
    totalSevas: 347, totalMeals: 128450, totalGoings: 23100,
    mealsToday: 4820, activeNow: 23, citiesCovered: 12,
    wasteKgSaved: 8420, co2Saved: 12.4, topCity: 'Delhi'
  };
  try {
    const { data: sevas } = await supabase.from('sevas').select('id, going_count, estimated_servings, city');
    const totalMeals = sevas?.reduce((s, r) => s + (r.estimated_servings || 0), 0) || 0;
    const totalGoings = sevas?.reduce((s, r) => s + (r.going_count || 0), 0) || 0;
    return {
      totalSevas: sevas?.length || 0, totalMeals, totalGoings,
      mealsToday: Math.round(totalMeals * 0.04), activeNow: sevas?.length || 0,
      citiesCovered: new Set(sevas?.map(s => s.city)).size || 1,
      wasteKgSaved: Math.round(totalMeals * 0.065),
      co2Saved: parseFloat((totalMeals * 0.000097).toFixed(1)),
      topCity: 'Delhi'
    };
  } catch (err) {
    console.error('getAnalytics failed:', err);
    return { totalSevas: 0, totalMeals: 0, totalGoings: 0, mealsToday: 0, activeNow: 0, citiesCovered: 0, wasteKgSaved: 0, co2Saved: 0, topCity: '-' };
  }
};
