import React, { createContext, useContext, useState, useEffect } from 'react';
import { LANGUAGES, LanguageCode, TRANSLATIONS, TranslationDictionary } from '../data/translations';

interface AccessibilityContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: TranslationDictionary;
  comfortMode: boolean;
  toggleComfortMode: () => void;
  isSpeaking: boolean;
  toggleSpeakPage: (customText?: string) => void;
  stopSpeaking: () => void;
  emergencyModalOpen: boolean;
  setEmergencyModalOpen: (open: boolean) => void;
  nearMeModalOpen: boolean;
  setNearMeModalOpen: (open: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>('fr');
  const [comfortMode, setComfortMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [nearMeModalOpen, setNearMeModalOpen] = useState(false);

  const currentLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    if (isSpeaking) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    const html = document.documentElement;
    html.lang = language;
    html.dir = currentLangObj.dir;
  }, [language, currentLangObj.dir]);

  useEffect(() => {
    const html = document.documentElement;
    if (comfortMode) {
      html.classList.add('comfort-mode');
    } else {
      html.classList.remove('comfort-mode');
    }
  }, [comfortMode]);

  const toggleComfortMode = () => {
    setComfortMode((prev) => !prev);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const toggleSpeakPage = (customText?: string) => {
    if (!('speechSynthesis' in window)) {
      alert('La synthèse vocale n’est pas prise en charge par votre navigateur.');
      return;
    }

    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    window.speechSynthesis.cancel();
    const mainEl = document.querySelector('main');
    const textToRead =
      customText ||
      (mainEl ? mainEl.innerText.replace(/\s+/g, ' ').trim().slice(0, 1200) : TRANSLATIONS[language].heroTitle);

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = currentLangObj.speechLang;
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        language,
        setLanguage,
        t: TRANSLATIONS[language],
        comfortMode,
        toggleComfortMode,
        isSpeaking,
        toggleSpeakPage,
        stopSpeaking,
        emergencyModalOpen,
        setEmergencyModalOpen,
        nearMeModalOpen,
        setNearMeModalOpen,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return ctx;
};
