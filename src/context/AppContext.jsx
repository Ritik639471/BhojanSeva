import { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext({});

export function AppProvider({ children }) {
  const [savedSevaIds, setSavedSevaIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bhojan_saved') || '[]'); }
    catch { return []; }
  });

  const [accessibilityMode, setAccessibilityMode] = useState(() => ({
    largeText: localStorage.getItem('bhojan_large_text') === 'true',
    lowBandwidth: localStorage.getItem('bhojan_low_bandwidth') === 'true',
  }));

  const [selectedCity, setSelectedCity] = useState(
    () => localStorage.getItem('bhojan_city') || 'Delhi'
  );

  const toggleSaved = useCallback((sevaId) => {
    setSavedSevaIds(prev => {
      const next = prev.includes(sevaId) ? prev.filter(id => id !== sevaId) : [...prev, sevaId];
      localStorage.setItem('bhojan_saved', JSON.stringify(next));
      return next;
    });
  }, []);

  const isSaved = useCallback((sevaId) => savedSevaIds.includes(sevaId), [savedSevaIds]);

  const toggleLargeText = () => {
    setAccessibilityMode(prev => {
      const next = { ...prev, largeText: !prev.largeText };
      localStorage.setItem('bhojan_large_text', String(next.largeText));
      document.documentElement.style.fontSize = next.largeText ? '18px' : '';
      return next;
    });
  };

  const toggleLowBandwidth = () => {
    setAccessibilityMode(prev => {
      const next = { ...prev, lowBandwidth: !prev.lowBandwidth };
      localStorage.setItem('bhojan_low_bandwidth', String(next.lowBandwidth));
      document.body.classList.toggle('low-bandwidth', next.lowBandwidth);
      return next;
    });
  };

  const changeCity = (city) => {
    setSelectedCity(city);
    localStorage.setItem('bhojan_city', city);
  };

  return (
    <AppContext.Provider value={{
      savedSevaIds, toggleSaved, isSaved,
      accessibilityMode, toggleLargeText, toggleLowBandwidth,
      selectedCity, changeCity
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
