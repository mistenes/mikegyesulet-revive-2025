import heroDefaultImage from "@/assets/mik-team.jpg";
import aboutDefaultImage from "@/assets/umbrella-person.jpg";
import galleryDefaultImage from "@/assets/regions-collage.jpg";
import { PageContentStore } from "@/types/pageContent";

export const defaultPageContent: PageContentStore = {
  hero_content: {
    hu: {
      title: "ÜDVÖZLÜNK A MAGYAR IFJÚSÁGI KONFERENCIA HONLAPJÁN!",
      description: "A Magyar Ifjúsági Konferencia Egyesület összeköti a Kárpát-medence magyar fiataljait.",
      primaryButtonText: "TAGSZERVEZETI PORTÁL",
      primaryButtonUrl: "https://dashboard.mikegyesulet.hu",
      secondaryButtonText: "TUDJ MEG TÖBBET",
      imageUrl: heroDefaultImage,
    },
    en: {
      title: "VOICE OF HUNGARIAN YOUTH",
      description: "The Hungarian Youth Conference Association unites young Hungarians across the Carpathian Basin.",
      primaryButtonText: "MEMBER PORTAL",
      primaryButtonUrl: "https://dashboard.mikegyesulet.hu",
      secondaryButtonText: "LEARN MORE",
      imageUrl: heroDefaultImage,
    },
  },
  hero_stats: {
    hu: {
      stats: [
        { value: "2000+", label: "Aktív tag" },
        { value: "10", label: "Régió" },
        { value: "150+", label: "Projekt" },
      ],
    },
    en: {
      stats: [
        { value: "2000+", label: "Active members" },
        { value: "10", label: "Regions" },
        { value: "150+", label: "Projects" },
      ],
    },
  },
  news_section: {
    hu: {
      subtitle: "FRISS HÍREINK, ÍRÁSAINK",
      title: "TÁJÉKOZÓDJ SZÜLŐFÖLDÜNKRŐL!",
      description: "Olvasd el legfrissebb híreinket a magyar fiatalokról a Kárpát-medencében.",
      buttonText: "MINDEN HÍR",
    },
    en: {
      subtitle: "OUR LATEST UPDATES",
      title: "STAY INFORMED ABOUT HUNGARIAN COMMUNITIES",
      description: "Read the latest stories about Hungarian youth living across the Carpathian Basin.",
      buttonText: "VIEW ALL NEWS",
    },
  },
  regions_section: {
    hu: {
      eyebrow: "RÉGIÓK",
      title: "Közösségeink a Kárpát-medencében",
      description: "Több mint 10 régióban képviseljük a magyar fiatalokat.",
      buttonText: "Fedezd fel a régiókat",
      chips: ["Erdély", "Felvidék", "Kárpátalja", "Vajdaság", "Horvátország", "Szlovénia"],
    },
    en: {
      eyebrow: "REGIONS",
      title: "Our communities across the Carpathian Basin",
      description: "We represent young Hungarians in more than 10 regions.",
      buttonText: "Discover the regions",
      chips: ["Transylvania", "Upper Hungary", "Transcarpathia", "Vojvodina", "Croatia", "Slovenia"],
    },
  },
  about_section: {
    hu: {
      badge: "RÓLUNK",
      title: "KIK VAGYUNK MI?",
      subtitle: "Magyar fiatalok összefogása",
      description:
        "Kattints, hogy megtudd, kik alkotják a MIK-et, hogyan oszlik meg a munka, és ismerd meg szervezeti struktúránkat.",
      buttonText: "Magunkról",
      ctaBadge: "ALAPÍTÓ NYILATKOZAT",
      ctaTitle: "Célkitűzéseink",
      ctaDescription: "Alapítóink világosan leírták, miért kell a magyar fiataloknak közös egyeztető fórum.",
      ctaButton: "Megnyitás",
      imageUrl: aboutDefaultImage,
    },
    en: {
      badge: "ABOUT",
      title: "WHO ARE WE?",
      subtitle: "Uniting Hungarian youth",
      description: "Learn who keeps HYCA running, how we work together and how the organisation is structured.",
      buttonText: "About us",
      ctaBadge: "FOUNDERS' STATEMENT",
      ctaTitle: "Our mission",
      ctaDescription: "The founders outlined why Hungarian youth needs a shared platform across the world.",
      ctaButton: "Open",
      imageUrl: aboutDefaultImage,
    },
  },
  regions_intro: {
    hu: {
      title: "Régióink",
      description: "Ismerd meg a Kárpát-medence magyar fiataljainak közösségeit és szervezeteit.",
      imageUrl: galleryDefaultImage,
    },
    en: {
      title: "Our regions",
      description: "Discover the Hungarian youth communities and organizations across the Carpathian Basin.",
      imageUrl: galleryDefaultImage,
    },
  },
  regions_map: {
    hu: {
      title: "Térkép",
      description: "Böngészd régióinkat térképen vagy a listából.",
    },
    en: {
      title: "Map",
      description: "Browse our regions on the map or from the list.",
    },
  },
  regions_list: {
    hu: {
      title: "Régió lista",
      description: "Részletes információk a tagszervezetekről régiónként.",
    },
    en: {
      title: "Region list",
      description: "Detailed information about member organizations by region.",
    },
  },
  gallery_intro: {
    hu: {
      title: "Galéria",
      description: "Böngészd legfrissebb fotóinkat és eseményeinket.",
      imageUrl: galleryDefaultImage,
    },
    en: {
      title: "Gallery",
      description: "Explore our latest event photos and albums.",
      imageUrl: galleryDefaultImage,
    },
  },
  gallery_images: {
    hu: {
      title: "Képek",
      description: "Válogatás kedvenc pillanatainkból.",
    },
    en: {
      title: "Photos",
      description: "A selection of our favorite moments.",
    },
  },
};
