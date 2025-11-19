import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";

// Example gallery data - will be editable through admin later
const galleryAlbums = [
  {
    id: 1,
    title: "Budapest, 2022.05.28.",
    subtitle: "A Magyar Ifjúsági Konferencia 38. rendes ülése",
    date: "2022-05-28",
    coverImage: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/629620d2fc15a39bc2704552_13-13_CSM_0738.jpg",
  },
  {
    id: 2,
    title: "Budapest, 2019.11.30.",
    subtitle: "A Magyar Ifjúsági Konferencia 37. rendes ülése",
    date: "2019-11-30",
    coverImage: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/5eb31f69948332dcdcc19711_IMG_7429.JPG",
  },
  {
    id: 3,
    title: "Felsőőr, 2019.05.11.",
    subtitle: "A Magyar Ifjúsági Konferencia 36. rendes ülése",
    date: "2019-05-11",
    coverImage: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/5eb3166fc8c0a47e0a59ad93_IMG_2536.JPEG",
  },
  {
    id: 4,
    title: "Kárpát-medencei Fiatal Vállalkozói Konferencia",
    subtitle: "Makkosjánosi, Kárpátalja",
    date: "2019-04-07",
    coverImage: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/5eb31b15bec24a33c59a106e_IMG_5638.JPG",
  },
  {
    id: 5,
    title: "Szakmai nap",
    subtitle: "MIK Szakmai nap",
    date: "2018-11-24",
    coverImage: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/5eb312bc5c5ac5c927386861_V%C3%A1rgesztes%2042.jpg",
  },
  {
    id: 6,
    title: "Nagyvárad, 2018.06.09.",
    subtitle: "A Magyar Ifjúsági Konferencia 34. rendes ülése",
    date: "2018-06-09",
    coverImage: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/5eb315dd4a0d69de84dcdf18_IMG_8668.JPG",
  },
];

export default function Galeria() {
  return (
    <div className="min-h-screen bg-background relative">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-7xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
            GALÉRIA
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Tekintse meg eseményeink és tevékenységeink fotóit
          </p>
        </div>
      </section>

      {/* Albums Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold mb-12 text-foreground">Albumok</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {galleryAlbums.map((album) => (
              <Card 
                key={album.id}
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 bg-card border-border"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={album.coverImage}
                    alt={album.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {album.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {album.subtitle}
                  </p>
                  <time className="text-xs text-muted-foreground/70">
                    {new Date(album.date).toLocaleDateString('hu-HU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </time>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
