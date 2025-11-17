import { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'hu' | 'en';

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
    'regions.bansag.name': 'Bánság és Regát',
    'regions.bansag.org1.name': 'Moldvai Csángómagyarok Szövetsége',
    'regions.bansag.org1.description': 'A Moldvai Csángómagyarok Szövetsége 1990 októberében alakult Sepsiszentgyörgyön. A szervezet célja a közösség képviselete és érdekeinek védelme. Tevékenysége ezért az identitástudat és az összetartozás erősítése, az örökölt nyelvi, kulturális, művészeti és tudományos ismeretek elsajátítása.',
    'regions.bansag.org2.name': 'Országos Magyar Diákszövetség',
    'regions.bansag.org2.description': 'Az OMDSZ a romániai egyetemi városokban működő magyar egyetemi hallgatók szervezeteinek érdekvédelmi és képviseleti szövetsége. 1990-ben alakult, jelenleg hét tagszervezete van a nagyobb egyetemi városokban.',
    'regions.burgenland.name': 'Burgenland',
    'regions.burgenland.org1.name': 'Burgenlandi Magyarok Népfőiskolája',
    'regions.burgenland.org1.description': 'A burgenlandi magyarok népfőiskolája a határon túli magyar közösség kulturális és oktatási központja.',
    'regions.erdely.name': 'Erdély',
    'regions.felvidek.name': 'Felvidék',
    'regions.horvat.name': 'Horvátország',
    'regions.karpatalja.name': 'Kárpátalja',
    'regions.magyarorszag.name': 'Magyarország',
    'regions.muravidek.name': 'Muravidék',
    'regions.nyugat.name': 'Nyugati Diaszpóra',
    'regions.vajdasag.name': 'Vajdaság',
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
    'regions.bansag.name': 'Bánság and Regát',
    'regions.bansag.org1.name': 'Alliance of Moldavian Csángó Hungarians',
    'regions.bansag.org1.description': 'The Alliance of Moldavian Csángó Hungarians was founded in October 1990 in Sepsiszentgyörgy. The organization aims to represent and protect the interests of the community through strengthening identity and promoting linguistic, cultural, artistic and scientific knowledge.',
    'regions.bansag.org2.name': 'National Union of Hungarian Students',
    'regions.bansag.org2.description': 'OMDSZ is the advocacy and representative union of Hungarian university student organizations in Romanian university cities. Founded in 1990, it currently has seven member organizations in major university cities.',
    'regions.burgenland.name': 'Burgenland',
    'regions.burgenland.org1.name': 'Hungarian Folk High School of Burgenland',
    'regions.burgenland.org1.description': 'The Hungarian Folk High School of Burgenland is the cultural and educational center of the Hungarian community beyond the border.',
    'regions.erdely.name': 'Transylvania',
    'regions.felvidek.name': 'Highlands',
    'regions.horvat.name': 'Croatia',
    'regions.karpatalja.name': 'Transcarpathia',
    'regions.magyarorszag.name': 'Hungary',
    'regions.muravidek.name': 'Muravidék',
    'regions.nyugat.name': 'Western Diaspora',
    'regions.vajdasag.name': 'Vojvodina',
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
