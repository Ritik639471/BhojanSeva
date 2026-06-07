import { createContext, useContext, useState } from 'react';

// Available languages
const translations = {
  en: {
    appName: 'BhojanSeva',
    tagline: 'Connecting Hearts, Feeding Souls',
    findFood: 'Find Free Food',
    addSeva: 'List a Seva Camp',
    allFilters: 'All',
    noSevas: 'No Sevas Found',
    noSevasDesc: 'No food camps match your current filter.',
    liveNow: 'Active Now',
    finished: 'Ended',
    runningLow: 'Running Low',
    navigate: 'Navigate',
    share: 'Share',
    goingBtn: "I'm Going",
    servingsLeft: 'servings left',
    crowdMeter: 'Crowd & Status Meter',
    communityUpdates: 'Community Updates',
    post: 'Post',
    publishNow: 'Publish Now — Go Live!',
    category: 'Category',
    whatServed: "What's Being Served?",
    dietaryTags: 'Dietary Tags',
    locationDetected: 'Location detected',
    serveNow: 'Serving',
    sos: 'SOS Alert',
    home: 'Home',
    findSeva: 'Find Seva',
    about: 'About',
    guidelines: 'Guidelines',
    contact: 'Contact',
    dashboard: 'Dashboard',
    leaderboard: 'Leaderboard',
    analytics: 'Analytics',
    login: 'Login',
    logout: 'Sign Out',
    search: 'Search sevas...',
    permanent: 'Permanent',
    traveling: 'Traveling',
    iGoing: "I'm Going",
    savePin: 'Save',
    reportPin: 'Report',
    sponsoredBy: 'Sponsored by',
    allergens: 'Allergens',
    aiDescription: 'AI Description',
    festivalMode: 'Festival Route Mode',
    verified: 'Verified',
  },
  hi: {
    appName: 'भोजनसेवा',
    tagline: 'दिल से दिल को जोड़ें, भूख मिटाएं',
    findFood: 'मुफ्त भोजन खोजें',
    addSeva: 'सेवा शिविर जोड़ें',
    allFilters: 'सभी',
    noSevas: 'कोई सेवा नहीं',
    noSevasDesc: 'आपके फ़िल्टर से मेल खाता कोई शिविर नहीं मिला।',
    liveNow: 'अभी सक्रिय',
    finished: 'समाप्त',
    runningLow: 'कम हो रहा है',
    navigate: 'रास्ता दिखाएं',
    share: 'शेयर करें',
    goingBtn: 'मैं जा रहा हूँ',
    servingsLeft: 'थाली बची हैं',
    crowdMeter: 'भीड़ मीटर',
    communityUpdates: 'समुदाय अपडेट',
    post: 'पोस्ट करें',
    publishNow: 'अभी प्रकाशित करें!',
    category: 'श्रेणी',
    whatServed: 'क्या परोसा जा रहा है?',
    dietaryTags: 'आहार टैग',
    locationDetected: 'स्थान मिला',
    serveNow: 'परोस रहे हैं',
    sos: 'SOS अलर्ट',
    home: 'होम',
    findSeva: 'सेवा खोजें',
    about: 'हमारे बारे में',
    guidelines: 'दिशानिर्देश',
    contact: 'संपर्क',
    dashboard: 'डैशबोर्ड',
    leaderboard: 'लीडरबोर्ड',
    analytics: 'विश्लेषण',
    login: 'लॉग इन',
    logout: 'लॉग आउट',
    search: 'सेवा खोजें...',
    permanent: 'स्थायी',
    traveling: 'यात्रा',
    iGoing: 'मैं जा रहा हूँ',
    savePin: 'सेव करें',
    reportPin: 'रिपोर्ट करें',
    sponsoredBy: 'प्रायोजित',
    allergens: 'एलर्जी',
    aiDescription: 'AI विवरण',
    festivalMode: 'उत्सव रूट मोड',
    verified: 'सत्यापित',
  }
};

const LangContext = createContext({});

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('bhojan_lang') || 'en');
  const t = (key) => translations[lang][key] || translations.en[key] || key;
  const switchLang = (l) => { setLang(l); localStorage.setItem('bhojan_lang', l); };

  return (
    <LangContext.Provider value={{ lang, t, switchLang }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
