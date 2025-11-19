import { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'hu' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  hu: {
    // Navigation
    'nav.about': 'RÓLUNK',
    'nav.regions': 'RÉGIÓK',
    'nav.documents': 'DOKUMENTUMOK',
    'nav.contact': 'KAPCSOLAT',
    'nav.gallery': 'GALÉRIA',
    'nav.projects': 'PROJEKTEK',
    
    // Hero
    'hero.title': 'A MAGYAR IFJÚSÁG HANGJA',
    'hero.subtitle': 'Magyar Ifjúsági Konferencia Egyesület',
    'hero.description': 'A magyarországi és határon túli magyar fiatalok legmagasabb szintű egyeztető fóruma',
    'hero.cta.portal': 'TAGSZERVEZETI PORTÁL',
    'hero.cta.learn': 'TUDJ MEG TÖBBET',
    
    // Stats
    'stats.members': 'Aktív tagok',
    'stats.regions': 'Régiók',
    'stats.projects': 'Projektek',
    
    // About page
    'about.title': 'RÓLUNK:',
    'about.subtitle': 'KIK IS VAGYUNK MI?',
    'about.leadership': 'Elnökség',
    'about.committee': 'Állandó bizottság',
    'about.supervisory': 'Felügyelőbizottság',
    'about.operational': 'Operatív csapat',
    'about.contact': 'Kapcsolat',
    'about.president': 'Elnök',
    'about.vice': 'Alelnök',
    'about.member': 'Tag',
    'about.secretary': 'Titkár',
    
    // Regions page
    'regions.hero.eyebrow': 'RÉGIÓK',
    'regions.hero.title': 'Hol is képviseljük a helyi magyarságot?',
    'regions.hero.subtitle': 'A MIK tagszervezetei',
    'regions.coming-soon': 'További információk hamarosan...',
  },
  en: {
    // Navigation
    'nav.about': 'ABOUT',
    'nav.regions': 'REGIONS',
    'nav.documents': 'DOCUMENTS',
    'nav.contact': 'CONTACT',
    'nav.gallery': 'GALLERY',
    'nav.projects': 'PROJECTS',
    
    // Hero
    'hero.title': 'VOICE OF HUNGARIAN YOUTH',
    'hero.subtitle': 'Hungarian Youth Conference Association',
    'hero.description': 'The highest level coordinating forum for Hungarian youth in Hungary and beyond',
    'hero.cta.portal': 'MEMBER PORTAL',
    'hero.cta.learn': 'LEARN MORE',
    
    // Stats
    'stats.members': 'Active Members',
    'stats.regions': 'Regions',
    'stats.projects': 'Projects',
    
    // About page
    'about.title': 'ABOUT US:',
    'about.subtitle': 'WHO WE ARE?',
    'about.leadership': 'Leadership',
    'about.committee': 'Standing Committee',
    'about.supervisory': 'Supervisory Board',
    'about.operational': 'Operational Team',
    'about.contact': 'Contact',
    'about.president': 'President',
    'about.vice': 'Vice President',
    'about.member': 'Member',
    'about.secretary': 'Secretary',
    
    // Regions page
    'regions.hero.eyebrow': 'REGIONS',
    'regions.hero.title': 'Where do we represent local Hungarians?',
    'regions.hero.subtitle': 'MIK Member Organizations',
    'regions.coming-soon': 'More information coming soon...',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('hu');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['hu']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
