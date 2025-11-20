import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

import { Card } from "@/components/ui/card";
import { Mail } from "lucide-react";

const timeline = [
  { year: "1999", event: "Megalakul a MIK" },
  { year: "2016", event: "Önálló jogi személlyé válás" },
  { year: "2020", event: "Segítség.ma projekt" },
  { year: "2021", event: "MIK Start program" },
  { year: "2022", event: "EVITA program" },
];

const leadership = [
  {
    name: "Turi Ádám",
    position: "Elnök",
    email: "elnok@mikegyesulet.hu",
  },
  {
    name: "Tuba Adrián",
    position: "Alelnök",
    email: "adrian.tuba@mikegyesulet.hu",
  },
  {
    name: "Hatos Attila",
    position: "Alelnök",
    email: "attila.hatos@mikegyesulet.hu",
  },
];

const standingCommittee = [
  { name: "Hatos Attila", region: "Bánság és regát", email: "" },
  { name: "Somogyi Attila", region: "Burgenland", email: "somogyi@gmx.net" },
  { name: "Szilágyi Dóra Emese", region: "Erdély", email: "" },
  { name: "Heringes Walter", region: "Felvidék", email: "" },
  { name: "Tuba Adrián", region: "Kárpátalja", email: "" },
  { name: "Turi Ádám", region: "Magyarország", email: "" },
  { name: "Bogar Patrik", region: "Muravidék", email: "patrik.bogar@gmail.com" },
  { name: "Németh Alexander", region: "Nyugati Diaszpóra", email: "martin.paszti@hunyouth.org" },
  { name: "Albert Éva", region: "Vajdaság", email: "bognaremese02@gmail.com" },
  { name: "", region: "Horvátország", email: "" },
];

const supervisoryBoard = [
  { name: "Brunner Tibor", position: "Elnök", email: "tibor.brunner@gmail.com" },
  { name: "Tőkés Lehel", position: "Tag", email: "tokeslehel@gmail.com" },
  { name: "Boncsarovszky Péter", position: "Tag", email: "peter.boncsarovszky@mikegyesulet.hu" },
];

const hyca = [
  { name: "Mészáros János", position: "Elnök", email: "" },
];

const hycaSupervisoryBoard = [
  { name: "Búcsú Ákos", position: "Tag", email: "" },
  { name: "Bence Norbert", position: "Tag", email: "" },
  { name: "Bogar Patrik", position: "Tag", email: "" },
];

const operationalTeam = [
  { name: "Bokor Boglárka", position: "Titkár", email: "titkarsag@mikegyesulet.hu" },
  { name: "Mészáros János", position: "Gazdasági vezető", email: "janos.meszaros@mikegyesulet.hu" },
  { name: "Boncsarovszky Péter", position: "Kommunikációs vezető", email: "peter.boncsarovszky@mikegyesulet.hu" },
  { name: "Vincze Barnabás", position: "Kommunikációs gyakornok", email: "barnabas.vincze@mikegyesulet.hu" },
];

export default function Rolunk() {
  return (
    <div className="min-h-screen bg-background relative">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-7xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-foreground">
            RÓLUNK:<br />KIK IS VAGYUNK MI?
          </h1>
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
            <p>
              A Magyar Ifjúsági Konferencia Egyesület (MIK) a magyarországi és a határon túli magyar fiatalok legmagasabb szintű egyeztető fóruma, amely a Magyar Kormány kezdeményezésére Budapesten, 1999. november 27-én széleskörű magyarországi és határon túli magyar szervezeti részvétellel lett életre hívva. A szervezet alapvető célja mind a mai napig, hogy az ifjúság legmagasabb szintű egyeztető fóruma legyen, ezzel pedig a Magyar Állandó Értekezlet ifjúsági lábát képezze.
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
            {leadership.map((person, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center">
                  <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-4xl font-bold text-primary">
                      {person.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-1">{person.name}</h3>
                <p className="text-muted-foreground mb-3">{person.position}</p>
                {person.email && (
                  <a
                    href={`mailto:${person.email}`}
                    className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
                  >
                    <Mail className="h-4 w-4" />
                    Kapcsolat
                  </a>
                )}
              </Card>
            ))}
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
            {standingCommittee.map((person, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center">
                  {person.name ? (
                    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">
                        {person.name.split(" ").map(n => n[0]).join("")}
                      </span>
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-muted-foreground/20 rounded-full" />
                  )}
                </div>
                {person.name && <h3 className="text-lg font-semibold mb-1">{person.name}</h3>}
                <p className="text-muted-foreground mb-3">{person.region}</p>
                {person.email && (
                  <a
                    href={`mailto:${person.email}`}
                    className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
                  >
                    <Mail className="h-4 w-4" />
                    Kapcsolat
                  </a>
                )}
              </Card>
            ))}
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
            {supervisoryBoard.map((person, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center">
                  <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-4xl font-bold text-primary">
                      {person.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-1">{person.name}</h3>
                <p className="text-muted-foreground mb-3">{person.position}</p>
                <a
                  href={`mailto:${person.email}`}
                  className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
                >
                  <Mail className="h-4 w-4" />
                  Kapcsolat
                </a>
              </Card>
            ))}
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
            {hyca.map((person, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center">
                  <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-4xl font-bold text-primary">
                      {person.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-1">{person.name}</h3>
                <p className="text-muted-foreground mb-3">{person.position}</p>
                {person.email && (
                  <a
                    href={`mailto:${person.email}`}
                    className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
                  >
                    <Mail className="h-4 w-4" />
                    Kapcsolat
                  </a>
                )}
              </Card>
            ))}
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
            {hycaSupervisoryBoard.map((person, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center">
                  <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-4xl font-bold text-primary">
                      {person.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-1">{person.name}</h3>
                <p className="text-muted-foreground mb-3">{person.position}</p>
                {person.email && (
                  <a
                    href={`mailto:${person.email}`}
                    className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
                  >
                    <Mail className="h-4 w-4" />
                    Kapcsolat
                  </a>
                )}
              </Card>
            ))}
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
            {operationalTeam.map((person, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center">
                  <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-3xl font-bold text-primary">
                      {person.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-1">{person.name}</h3>
                <p className="text-muted-foreground mb-3">{person.position}</p>
                <a
                  href={`mailto:${person.email}`}
                  className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
                >
                  <Mail className="h-4 w-4" />
                  Kapcsolat
                </a>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
