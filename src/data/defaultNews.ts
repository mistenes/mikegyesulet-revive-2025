import { NewsArticle } from "@/types/news";

export const defaultNews: NewsArticle[] = [
  {
    id: "1",
    category: "Közösség",
    imageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop",
    published: true,
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    translations: {
      hu: {
        title: "Erdélyi találkozó a fiatal vezetőkkel",
        slug: "erdelyi-talalkozo",
        excerpt: "A MIK delegációja Marosvásárhelyen egyeztetett a régió fiatal szervezeteivel.",
        content: "A találkozón kiemeltük, hogy a régiók közötti együttműködés tovább erősödik."
      },
      en: {
        title: "Transylvanian forum with young leaders",
        slug: "transylvanian-forum",
        excerpt: "The association met organisations in Târgu Mureș to discuss regional cooperation.",
        content: "We emphasized how cross-border collaboration continues to grow."
      }
    }
  },
  {
    id: "2",
    category: "Nemzetközi",
    imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&auto=format&fit=crop",
    published: true,
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    translations: {
      hu: {
        title: "Ifjúsági küldöttség Brüsszelben",
        slug: "ifjusagi-kuldottseg-brusszelben",
        excerpt: "Bemutattuk a magyar fiatalok programjait az Európai Parlamentben.",
        content: "A résztvevők közös projektek indításáról döntöttek."
      },
      en: {
        title: "Youth delegation visits Brussels",
        slug: "youth-delegation-brussels",
        excerpt: "We presented Hungarian youth initiatives inside the European Parliament.",
        content: "Participants agreed on launching joint programmes."
      }
    }
  },
  {
    id: "3",
    category: "Program",
    imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&auto=format&fit=crop",
    published: true,
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    translations: {
      hu: {
        title: "Új mentorprogram a határon túli fiataloknak",
        slug: "uj-mentorprogram",
        excerpt: "Elindítottuk az egymást támogató mentorhálózatot.",
        content: "A résztvevők digitális eszközöket kapnak a kapcsolattartáshoz."
      },
      en: {
        title: "New mentorship programme for youth abroad",
        slug: "new-mentorship-programme",
        excerpt: "We launched a peer-support mentoring network.",
        content: "Participants receive digital toolkits to stay connected."
      }
    }
  }
];
