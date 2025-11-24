import heroDefaultImage from "@/assets/mik-team.jpg";
import aboutDefaultImage from "@/assets/umbrella-person.jpg";
import galleryDefaultImage from "@/assets/regions-collage.jpg";
import workspaceImage from "@/assets/workspace.jpg";
import { PageContentStore } from "@/types/pageContent";

export const defaultPageContent: PageContentStore = {
  impact_section: {
    hu: {
      badge: "Büszkék vagyunk",
      title: "Hatásunk számokban",
      description: "Több mint két évtizede építjük a magyar ifjúság jövőjét, és számíthatunk közösségünk erejére.",
      stats: [
        { value: "1000+", label: "Tag", description: "Tagszervezeteinken keresztül" },
        { value: "10", label: "Régió", description: "A Kárpát-medence minden sarkából" },
        { value: "150+", label: "Projekt", description: "Sikeres közösségi programok" },
        { value: "25+", label: "Év", description: "Tapasztalat és elkötelezettség" },
      ],
    },
    en: {
      badge: "What we are proud of",
      title: "Our impact in numbers",
      description: "For more than two decades we have been building the future of Hungarian youth together.",
      stats: [
        { value: "1000+", label: "Members", description: "Through our network of organisations" },
        { value: "10", label: "Regions", description: "Across the entire Carpathian Basin" },
        { value: "150+", label: "Projects", description: "Successful community programmes" },
        { value: "25+", label: "Years", description: "Experience and dedication" },
      ],
    },
  },
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
  testimonials_section: {
    hu: {
      badge: "Közösségünk",
      title: "Mit Mondanak Tagjaink",
      description: "A MIK közösségének tagjai osztják meg tapasztalataikat és élményeiket",
      testimonials: [
        {
          quote:
            "A MIK megmutatta, hogy mennyire erős lehet egy közösség, ha együtt dolgozunk céljainkért. Itt találtam meg az igazi társakat, akikkel közösen alakíthatjuk a jövőnket.",
          author: "Kovács Anna",
          role: "Tagszervező",
          region: "Erdély",
          image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
        },
        {
          quote:
            "Évek óta aktív tagja vagyok a MIK-nek, és minden alkalommal megtapasztalom, milyen fontos, hogy legyen egy olyan platform, ahol a fiatalok hangja számít és meghallgatásra talál.",
          author: "Nagy Péter",
          role: "Közgyűlési Tag",
          region: "Felvidék",
          image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
        },
        {
          quote:
            "A konferenciákon való részvétel megváltoztatta az életemet. Rengeteg motivált fiatallal találkoztam, akik ugyanúgy hittek a közös célokban, mint én.",
          author: "Szabó Júlia",
          role: "Projektkoordinátor",
          region: "Kárpátalja",
          image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
        },
      ],
    },
    en: {
      badge: "Our community",
      title: "What our members say",
      description: "HYCA members share their experiences and takeaways",
      testimonials: [
        {
          quote:
            "HYCA showed me how strong a community can be when we work toward our goals together. I found peers who share my passion for shaping our future.",
          author: "Anna Kovács",
          role: "Member organiser",
          region: "Transylvania",
          image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
        },
        {
          quote:
            "I have been active in HYCA for years and always see how important it is to have a platform where young voices matter and are heard.",
          author: "Péter Nagy",
          role: "Assembly member",
          region: "Upper Hungary",
          image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
        },
        {
          quote:
            "Attending the conferences changed my life. I met so many motivated young people who believe in our shared goals just as much as I do.",
          author: "Júlia Szabó",
          role: "Project coordinator",
          region: "Transcarpathia",
          image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
        },
      ],
    },
  },
  regions_intro: {
    hu: {
      eyebrow: "RÉGIÓK",
      title: "Régióink",
      description: "Ismerd meg a Kárpát-medence magyar fiataljainak közösségeit és szervezeteit.",
      imageUrl: galleryDefaultImage,
    },
    en: {
      eyebrow: "REGIONS",
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
  closing_section: {
    hu: {
      badge: "ZÁRÓNYILATKOZATOK",
      title: "NEM CSAK DOKUMENTUM, HELYZETKÉP",
      description:
        "A Magyar Ifjúsági Konferencia mindent ülése végén elfogad egy zárónyilatkozatot, ami reflektál az utóbbi fél év történéseire. Ezzel nem csak egy dokumentumot hozunk létre, hanem egy krónikát is, hiszen a zárónyilatkozatok visszaolvasásával nyomon követhetők a Kárpát-medence magyarságát érintő történések.",
      buttonText: "ZÁRÓNYILATKOZATOK",
      imageUrl: workspaceImage,
    },
    en: {
      badge: "CLOSING STATEMENTS",
      title: "MORE THAN A DOCUMENT, A SNAPSHOT",
      description:
        "After each assembly, HYCA adopts a closing statement that reflects on the previous half year. These statements are chronicles too, showing what affected Hungarian communities across the Carpathian Basin.",
      buttonText: "CLOSING STATEMENTS",
      imageUrl: workspaceImage,
    },
  },
  contact_section: {
    hu: {
      badge: "Kapcsolat",
      title: "Vedd fel velünk a kapcsolatot",
      description: "Itt üzenhetsz nekünk. Egyszerűbb, mint e-mailt írni, és ugyanolyan hatékony.",
      offices: [
        { name: "Központi Iroda", address: "2900 Komárom, Arany János utca 17.", hours: ["H-Cs: 8:30-16:00", "P-V: zárva"] },
        {
          name: "Kárpátaljai Iroda",
          address: "Beregszász, Mihók Péter út 4.",
          hours: ["H-K: 8:00-14:00", "Sz-Cs: 12:00-18:00", "P: 8:00-14:00", "Szo-V: zárva"],
        },
      ],
    },
    en: {
      badge: "Contact",
      title: "Get in touch with us",
      description: "Send us a message directly—it is quicker than email and just as effective.",
      offices: [
        { name: "Central Office", address: "Komárom, Arany János utca 17.", hours: ["Mon-Thu: 8:30-16:00", "Fri-Sun: closed"] },
        {
          name: "Transcarpathia Office",
          address: "Beregszász, Mihók Péter út 4.",
          hours: ["Mon-Tue: 8:00-14:00", "Wed-Thu: 12:00-18:00", "Fri: 8:00-14:00", "Sat-Sun: closed"],
        },
      ],
    },
  },
};
