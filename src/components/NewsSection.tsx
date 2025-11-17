import { useRef, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { supabase } from "@/integrations/supabase/client";

type NewsArticle = {
  id: string;
  title: string;
  excerpt: string;
  image_url: string | null;
  category: string;
  published_at: string | null;
};

type NewsSectionContent = {
  subtitle: string;
  title: string;
  description: string;
  buttonText: string;
};

export const NewsSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isVisible = useScrollAnimation(sectionRef);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionContent, setSectionContent] = useState<NewsSectionContent>({
    subtitle: "FRISS HÍREINK, ÍRÁSAINK",
    title: "TÁJÉKOZÓDJ SZÜLŐFÖLDÜNKRŐL!",
    description: "Vagy olvass el minden írást a HYCA blogon",
    buttonText: "HYCA BLOG",
  });

  useEffect(() => {
    fetchNews();
    fetchSectionContent();
  }, []);

  const fetchSectionContent = async () => {
    try {
      const { data } = await supabase
        .from("page_content")
        .select("content")
        .eq("section_key", "news_section")
        .single();

      if (data) setSectionContent(data.content as NewsSectionContent);
    } catch (error) {
      console.error("Error fetching section content:", error);
    }
  };

  const fetchNews = async () => {
    try {
      const { data, error } = await supabase
        .from("news_articles")
        .select("id, title, excerpt, image_url, category, published_at")
        .eq("published", true)
        .order("published_at", { ascending: false })
        .limit(4);

      if (error) throw error;
      setNews(data || []);
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("hu-HU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <section ref={sectionRef} className="py-24 bg-gradient-subtle">
      <div className="container px-4">
        <div 
          className={`mb-12 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <p className="text-sm font-semibold text-primary mb-2 uppercase tracking-wider">
            {sectionContent.subtitle}
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>
            {sectionContent.title}
          </h2>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl">
            {sectionContent.description}
          </p>
          <Button variant="outline" className="group border-2 border-foreground hover:bg-foreground hover:text-background font-semibold transition-all duration-300">
            {sectionContent.buttonText}
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <div className="h-56 bg-muted" />
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-6 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-1/4" />
                </div>
              </Card>
            ))}
          </div>
        ) : news.length > 0 ? (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Featured newest article */}
            <Card
              className={`group overflow-hidden border-border hover:shadow-xl transition-all duration-700 hover:-translate-y-2 cursor-pointer h-full ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
              }`}
            >
              <div className="relative h-[400px] overflow-hidden">
                <img 
                  src={news[0].image_url || "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=600&fit=crop"} 
                  alt={news[0].title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="p-8 space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Calendar className="h-3 w-3" />
                  {news[0].category} – {formatDate(news[0].published_at)}
                </div>
                <h3 className="text-2xl font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                  {news[0].title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {news[0].excerpt}
                </p>
                <div className="pt-2">
                  <span className="inline-flex items-center text-primary hover:text-primary-glow font-semibold text-sm group-hover:gap-3 transition-all">
                    Részletek
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            </Card>

            {/* Other 3 articles in a column */}
            <div className="flex flex-col gap-6">
              {news.slice(1, 4).map((item, index) => (
                <Card
                  key={item.id}
                  className={`group overflow-hidden border-border hover:shadow-xl transition-all duration-700 hover:-translate-y-2 cursor-pointer ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
                  }`}
                  style={{ transitionDelay: `${(index + 1) * 100}ms` }}
                >
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative sm:w-48 h-48 sm:h-auto overflow-hidden flex-shrink-0">
                      <img 
                        src={item.image_url || "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=300&fit=crop"} 
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div className="p-6 space-y-3 flex-1">
                      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <Calendar className="h-3 w-3" />
                        {item.category} – {formatDate(item.published_at)}
                      </div>
                      <h3 className="text-lg font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                      <div className="pt-2">
                        <span className="inline-flex items-center text-primary hover:text-primary-glow font-semibold text-sm group-hover:gap-3 transition-all">
                          Részletek
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground">Még nincsenek publikált hírek.</p>
        )}
      </div>
    </section>
  );
};
