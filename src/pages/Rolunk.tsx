import type React from "react";
import { useMemo, useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

import { Card } from "@/components/ui/card";
import { Mail } from "lucide-react";
import { useSectionContent } from "@/hooks/useSectionContent";
import { useLanguage } from "@/contexts/LanguageContext";
import { defaultPageContent } from "@/data/defaultPageContent";
import { isAdminPreview, notifyAdminFocus } from "@/lib/adminPreview";
import { getTeamMembers, type TeamMember } from "@/services/teamService";

const regionAnchors: Record<string, string> = {
  "Erdély": "erdely",
  "Felvidék": "felvidek",
  "Kárpátalja": "karpatalja",
  "Vajdaság": "vajdasag",
  "Horvátország": "horvatorszag",
  "Szlovénia": "szlovenia",
  "Vajdaság és Horvátország": "vajdasag",
};

const timeline = [
  { year: "1999", event: "Megalakul a MIK" },
  { year: "2016", event: "Önálló jogi személlyé válás" },
  { year: "2020", event: "Segítség.ma projekt" },
  { year: "2021", event: "MIK Start program" },
  { year: "2022", event: "EVITA program" },
];

export default function Rolunk() {
  const { language } = useLanguage();
  const { content: aboutContent } = useSectionContent("about_section");
  const adminPreview = isAdminPreview();
  const [members, setMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    getTeamMembers().then(setMembers).catch(console.error);
  }, []);

  const leadership = useMemo(() => members.filter(m => m.section === "leadership").sort((a, b) => a.sort_order - b.sort_order), [members]);
  const standingCommittee = useMemo(() => members.filter(m => m.section === "standing_committee").sort((a, b) => a.sort_order - b.sort_order), [members]);
  const supervisoryBoard = useMemo(() => members.filter(m => m.section === "supervisory_board").sort((a, b) => a.sort_order - b.sort_order), [members]);
  const hyca = useMemo(() => members.filter(m => m.section === "hyca").sort((a, b) => a.sort_order - b.sort_order), [members]);
  const hycaSupervisoryBoard = useMemo(() => members.filter(m => m.section === "hyca_supervisory_board").sort((a, b) => a.sort_order - b.sort_order), [members]);
  const operationalTeam = useMemo(() => members.filter(m => m.section === "operational_team").sort((a, b) => a.sort_order - b.sort_order), [members]);

  const handleHeroClick = (event: React.MouseEvent<HTMLElement>, fieldKey: string) => {
    if (notifyAdminFocus("about_section", fieldKey)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const heroContent = useMemo(() => {
    const fallback = defaultPageContent.about_section;
    const localized = (aboutContent?.[language] || aboutContent?.hu || fallback?.[language] || fallback?.hu || {}) as {
      title?: string;
      subtitle?: string;
      description?: string;
      imageUrl?: string;
    };

    return {
      title: localized.title || "RÓLUNK: KIK IS VAGYUNK MI?",
      subtitle: localized.subtitle || "Magyar fiatalok összefogása a Kárpát-medencében.",
      description:
        localized.description ||
        "A Magyar Ifjúsági Konferencia Egyesület (MIK) a magyarországi és a határon túli magyar fiatalok legmagasabb szintű egyeztető fóruma.",
      imageUrl: localized.imageUrl,
    };
  }, [aboutContent, language]);

  const renderMemberCard = (person: TeamMember, isRegion: boolean = false) => (
    <Card
      key={person.id}
      id={isRegion ? regionAnchors[person.position] : undefined}
      className="p-6 hover:shadow-lg transition-shadow flex flex-col h-full"
    >
      <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center overflow-hidden">
        {person.image_url ? (
          <img src={person.image_url} alt={person.name} className="w-full h-full object-cover" />
        ) : (
          <div className={`rounded-full flex items-center justify-center ${isRegion ? 'w-20 h-20' : 'w-24 h-24'} bg-primary/20`}>
            <span className={`${isRegion ? 'text-2xl' : 'text-3xl'} font-bold text-primary`}>
              {person.name ? person.name.split(" ").map(n => n[0]).join("") : "?"}
            </span>
          </div>
        )}
      </div>
      <h3 className={`${isRegion ? 'text-lg' : 'text-xl'} font-semibold mb-1`}>{person.name}</h3>
      <p className="text-muted-foreground mb-3">{person.position}</p>
      {person.email && (
        <a
          href={`mailto:${person.email}`}
          className="inline-flex items-center gap-2 text-primary hover:underline text-sm mt-auto"
        >
          <Mail className="h-4 w-4" />
          Kapcsolat
        </a>
      )}
    </Card>
  );

  return (
    <div className="min-h-screen bg-background relative">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 bg-gradient-to-b from-primary/5 to-background relative overflow-hidden">
        {heroContent.imageUrl && (
          <div className="absolute inset-0 z-0">
            <img src={heroContent.imageUrl} alt="Cover" className="w-full h-full object-cover opacity-10" />
          </div>
        )}
        <div className="container mx-auto max-w-7xl space-y-4 relative z-10">
          <h1
            className={`text-5xl md:text-6xl font-bold text-foreground ${adminPreview ? "cursor-pointer" : ""}`}
            style={{ fontFamily: "'Sora', sans-serif" }}
            onClick={(event) => handleHeroClick(event, "title")}
            role={adminPreview ? "button" : undefined}
            tabIndex={adminPreview ? 0 : undefined}
          >
            {heroContent.title}
          </h1>
          <p
            className={`text-xl text-muted-foreground max-w-3xl ${adminPreview ? "cursor-pointer" : ""}`}
            onClick={(event) => handleHeroClick(event, "subtitle")}
            role={adminPreview ? "button" : undefined}
            tabIndex={adminPreview ? 0 : undefined}
          >
            {heroContent.subtitle}
          </p>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 px-4 bg-card/30">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {timeline.map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                  {item.year}
                </div>
                <div className="text-sm md:text-base text-muted-foreground">
                  {item.event}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Text Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="space-y-6 text-lg leading-relaxed text-foreground/90">
            <p
              className={adminPreview ? "cursor-pointer" : undefined}
              onClick={(event) => handleHeroClick(event, "description")}
              role={adminPreview ? "button" : undefined}
              tabIndex={adminPreview ? 0 : undefined}
            >
              {heroContent.description}
            </p>
            <p>
              A MIK célja a magyar ifjúság bevonása az össznemzeti ifjúságpolitika alakításába. Ennek révén elősegíthető a Magyarország határain túl élő magyar ifjúsági közösségek magyarországi erkölcsi, anyagi, szakmapolitikai és diplomáciai támogatása is.
            </p>
            <p>
              További célkitűzésként szerepel a hazai és külhoni ifjúsági szervezetek közötti párbeszéd, és szakmai fejlesztő találkozások koordinálása, határokon átnyúló programok és rendezvények elősegítése.
            </p>
            <p>
              A közös munka célja, hogy minél több magyar fiatal számára nyíljon lehetőség a szervezetek által megvalósuló programokon, rendezvényeken való részvételre. A MIK 2016. május 4-én végül önálló jogi személlyé vált.
            </p>
            <p>
              Jelenleg 45 tagszervezete van 10 régióból, olyan egyesületek a tagjai, mint pártok ifjúsági szervezetei, hallgatói csoportosulások, cserkészegyesületek, egyházak ifjúsági szervezetei, civil szervezetek.
            </p>
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <section className="py-16 px-4 bg-card/30">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-4xl font-bold mb-4 text-foreground">Elnökség</h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-3xl">
            A MIK vezető tisztségviselőit a Közgyűlés választja két éves időtartamra. Az egyesület törvényes képviseletét az elnök látja el.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {leadership.map(person => renderMemberCard(person))}
          </div>
        </div>
      </section>

      {/* Standing Committee Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-4xl font-bold mb-4 text-foreground">Állandó bizottság</h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-3xl">
            A MIK működése során az Elnökségre az Állandó Bizottság megnevezést használja. Az elnökség az egyesület elnökéből és további 10 elnökségi tagból álló ügyvezető szerve, amely dönt mindazon kérdésekben, amelyet jogszabály vagy alapszabály nem utal a közgyűlés kizárólagos hatáskörébe.
          </p>

          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {standingCommittee.map(person => renderMemberCard(person, true))}
          </div>
        </div>
      </section>

      {/* Supervisory Board Section */}
      <section className="py-16 px-4 bg-card/30">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-4xl font-bold mb-4 text-foreground">Felügyelőbizottság</h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-3xl">
            A három tagból álló felügyelőbizottság feladata a MIK törvényes működésének, valamint a jogszabályok, az alapszabály és az egyesületi határozatok végrehajtásának, betartásának ellenőrzése.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {supervisoryBoard.map(person => renderMemberCard(person))}
          </div>
        </div>
      </section>

      {/* HYCA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-4xl font-bold mb-4 text-foreground">HYCA</h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-3xl">
            A HYCA vezetése, amely a nemzetközi kapcsolatok és ifjúsági együttműködések koordinációjáért felel.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {hyca.map(person => renderMemberCard(person))}
          </div>
        </div>
      </section>

      {/* HYCA Supervisory Board Section */}
      <section className="py-16 px-4 bg-card/30">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-4xl font-bold mb-4 text-foreground">HYCA Felügyelő Bizottság</h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-3xl">
            A HYCA felügyelő bizottsága biztosítja a szervezet működésének átláthatóságát és megfelelőségét.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {hycaSupervisoryBoard.map(person => renderMemberCard(person))}
          </div>
        </div>
      </section>

      {/* Operational Team Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-4xl font-bold mb-4 text-foreground">Operatív csapat</h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-3xl">
            Az operatív csapat általában elnöki megbízottakból áll, akiknek a feladatuk a végrehajtás.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {operationalTeam.map(person => renderMemberCard(person))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
