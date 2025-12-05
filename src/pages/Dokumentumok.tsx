import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileText, Download, Search, Calendar, MapPin } from "lucide-react";
import { defaultDocuments } from "@/data/documents";
import { useState, useMemo, useEffect } from "react";
import { fetchDocuments } from "@/services/documentsService";
import { type Document } from "@/types/documents";

export default function Dokumentumok() {
  const { language, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [documents, setDocuments] = useState<Document[]>(defaultDocuments);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    fetchDocuments()
      .then((docs) => {
        if (isMounted) {
          setDocuments(docs);
        }
      })
      .catch(() => {
        if (isMounted) {
          setDocuments(defaultDocuments);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = [
    { id: "all", label: language === 'hu' ? "Összes" : "All" },
    { id: "statute", label: language === 'hu' ? "Alapszabály" : "Charter" },
    { id: "founding", label: language === 'hu' ? "Alapító Nyilatkozat" : "Founding Declaration" },
    { id: "closing-statement", label: language === 'hu' ? "Zárónyilatkozatok" : "Closing Statements" },
    { id: "other", label: language === 'hu' ? "Egyéb" : "Other" }
  ];

  const charterDocs = useMemo(() => {
    return documents
      .filter(doc => doc.category === "statute")
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [documents]);

  const foundingDocs = useMemo(() => {
    return documents
      .filter(doc => doc.category === "founding")
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    return documents
      .filter(doc => {
        // Exclude charter and founding from main grid
        if (doc.category === "statute" || doc.category === "founding" || doc.category === "other") {
          return false;
        }
        
        if (selectedCategory !== "all" && doc.category !== selectedCategory) {
          return false;
        }
        
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const title = (language === 'hu' ? doc.title : doc.titleEn).toLowerCase();
          const location = doc.location?.toLowerCase() || "";
          return title.includes(query) || location.includes(query) || doc.date.includes(query);
        }
        
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [documents, searchQuery, selectedCategory, language]);

  const otherDocs = useMemo(() => {
    return documents
      .filter(doc => doc.category === "other")
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [documents]);

  const displayedCount = useMemo(() => {
    if (selectedCategory === "other") {
      return otherDocs.length;
    }

    if (selectedCategory === "all") {
      return filteredDocuments.length + otherDocs.length;
    }

    return filteredDocuments.length;
  }, [filteredDocuments.length, otherDocs.length, selectedCategory]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) {
      return language === 'hu' ? 'Dátum nélkül' : 'No date';
    }

    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) {
      return dateStr;
    }

    if (language === 'hu') {
      return date.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6 animate-fade-in">
            <p className="text-sm font-semibold text-primary tracking-wider uppercase">
              {language === 'hu' ? 'Dokumentumok' : 'Documents'}
            </p>
            <h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              {language === 'hu' ? 'Dokumentumtár' : 'Document Library'}
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {language === 'hu' 
                ? 'A Magyar Ifjúsági Konferencia hivatalos dokumentumai és zárónyilatkozatai' 
                : 'Official documents and closing statements of the Hungarian Youth Conference'}
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === 'hu' ? 'Keresés...' : 'Search...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap justify-center">
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {isLoading
              ? language === 'hu'
                ? 'Betöltés...'
                : 'Loading documents...'
              : `${displayedCount} ${language === 'hu' ? 'dokumentum található' : 'documents found'}`}
          </div>
        </div>
      </section>

      {/* Introduction for Charter */}
      {(selectedCategory === "all" || selectedCategory === "statute") && (
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <Card className="border-border/50 shadow-lg">
              <CardContent className="p-8 space-y-6">
                <div>
                  <h2 
                    className="text-2xl font-bold text-foreground mb-4"
                    style={{ fontFamily: "'Sora', sans-serif" }}
                  >
                    {language === 'hu' ? 'Alapszabály' : 'Charter'}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {language === 'hu' 
                      ? 'A Magyar Ifjúsági Konferencia Egyesület alapszabálya határozza meg a szervezet jogi kereteit, működési elveit, és tagszervezeteinek jogait és kötelezettségeit. Az alapszabály biztosítja a demokratikus működést és a Kárpát-medencei magyar ifjúsági szervezetek együttműködésének alapjait.'
                      : 'The Charter of the Hungarian Youth Conference Association defines the legal framework, operational principles, and the rights and obligations of member organizations. The Charter ensures democratic operation and establishes the foundation for cooperation among Hungarian youth organizations in the Carpathian Basin.'}
                  </p>
                </div>

                <div className="grid gap-4 pt-4">
                  {charterDocs.map((doc, index) => (
                    <Card 
                      key={index}
                      className="hover:shadow-lg transition-all duration-300 border-border/50 group"
                    >
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <FileText className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-foreground">
                                {language === 'hu' ? doc.title : doc.titleEn}
                              </h3>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(doc.date)}</span>
                        </div>

                        <Button 
                          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                          variant="outline"
                          asChild
                        >
                          <a href={doc.url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            {language === 'hu' ? 'Letöltés' : 'Download'}
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Introduction for Founding Declaration */}
      {(selectedCategory === "all" || selectedCategory === "founding") && (
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <Card className="border-border/50 shadow-lg">
              <CardContent className="p-8 space-y-6">
                <div>
                  <h2 
                    className="text-2xl font-bold text-foreground mb-4"
                    style={{ fontFamily: "'Sora', sans-serif" }}
                  >
                    {language === 'hu' ? 'Alapító Nyilatkozat' : 'Founding Declaration'}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {language === 'hu' 
                      ? 'Az Alapító Nyilatkozat a Magyar Ifjúsági Konferencia létrejöttének alapdokumentuma, amely megfogalmazza a szervezet küldetését, céljait és értékrendjét. Ez a dokumentum fektetett le először a Kárpát-medencei magyar ifjúsági civil társadalom együttműködésének és összefogásának alapelveit.'
                      : 'The Founding Declaration is the foundational document of the Hungarian Youth Conference, articulating the organization\'s mission, goals, and values. This document first established the principles of cooperation and solidarity within the Hungarian youth civil society of the Carpathian Basin.'}
                  </p>
                </div>

                <div className="grid gap-4 pt-4">
                  {foundingDocs.map((doc, index) => (
                    <Card 
                      key={index}
                      className="hover:shadow-lg transition-all duration-300 border-border/50 group"
                    >
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <FileText className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-foreground">
                                {language === 'hu' ? doc.title : doc.titleEn}
                              </h3>
                            </div>
                          </div>
                        </div>

                        {doc.location && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{doc.location}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(doc.date)}</span>
                        </div>

                        <Button 
                          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                          variant="outline"
                          asChild
                        >
                          <a href={doc.url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            {language === 'hu' ? 'Letöltés' : 'Download'}
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {(selectedCategory === "all" || selectedCategory === "other") && otherDocs.length > 0 && (
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <Card className="border-border/50 shadow-lg">
              <CardContent className="p-8 space-y-6">
                <div>
                  <h2
                    className="text-2xl font-bold text-foreground mb-4"
                    style={{ fontFamily: "'Sora', sans-serif" }}
                  >
                    {language === 'hu' ? 'Egyéb' : 'Other'}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {language === 'hu'
                      ? 'A Magyar Ifjúsági Konferencia működéséhez kapcsolódó egyéb dokumentumok.'
                      : 'Additional documents related to the operation of the Hungarian Youth Conference.'}
                  </p>
                </div>

                <div className="grid gap-4 pt-4">
                  {otherDocs.map((doc, index) => (
                    <Card
                      key={index}
                      className="hover:shadow-lg transition-all duration-300 border-border/50 group"
                    >
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <FileText className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-foreground">
                                {language === 'hu' ? doc.title : doc.titleEn}
                              </h3>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(doc.date)}</span>
                        </div>

                        <Button
                          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                          variant="outline"
                          asChild
                        >
                          <a href={doc.url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            {language === 'hu' ? 'Letöltés' : 'Download'}
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Introduction for Closing Statements */}
      {(selectedCategory === "all" || selectedCategory === "closing-statement") && (
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <Card className="border-border/50 shadow-lg">
              <CardContent className="p-8">
                <h2 
                  className="text-2xl font-bold text-foreground mb-4"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  {language === 'hu' ? 'Zárónyilatkozatok' : 'Closing Statements'}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {language === 'hu' 
                    ? 'A zárónyilatkozatok nem csak egy ülés végén elfogadott dokumentumok: ebben reflektál a Magyar Ifjúsági Konferencia a Kárpát-medence és a világ magyarságát érintő történésekre, fejezi ki aggályait, vagy épp örömét. Ezzel a zárónyilatkozatok egyfajta krónikát is adnak a magyarság utóbbi húsz évéből.'
                    : 'Closing statements are not just documents adopted at the end of a meeting: through them, the Hungarian Youth Conference reflects on events affecting Hungarians in the Carpathian Basin and worldwide, expresses its concerns or joy. These statements provide a chronicle of the past twenty years of the Hungarian community.'}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Documents List */}
      {selectedCategory !== "other" && (
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments.map((doc, index) => (
                <Card
                  key={index}
                  className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-border/50 group"
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-foreground">
                            {language === 'hu' ? doc.title : doc.titleEn}
                          </h3>
                        </div>
                      </div>
                    </div>

                    {doc.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{doc.location}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(doc.date)}</span>
                    </div>

                    <Button
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      variant="outline"
                      asChild
                    >
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        {language === 'hu' ? 'Letöltés' : 'Download'}
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredDocuments.length === 0 && (
              <div className="text-center py-20">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {language === 'hu' ? 'Nincs találat' : 'No documents found'}
                </h3>
                <p className="text-muted-foreground">
                  {language === 'hu'
                    ? 'Próbálj meg más keresési kifejezést vagy szűrőt használni'
                    : 'Try using different search terms or filters'}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
