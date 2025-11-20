import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import puzzleLogo from "@/assets/puzzle-logo.png";

export const Footer = () => {
  return (
    <footer className="bg-muted/30 py-16">
      <div className="container px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Logo & Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img src={puzzleLogo} alt="MIK Logo" className="h-12 w-12" />
              <span className="text-xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
                MAGYAR IFJÚSÁGI<br/>KONFERENCIA
              </span>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-foreground">Magyar</span>
              <span className="text-muted-foreground">▼</span>
            </div>
            <div className="flex gap-3">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Oldalak */}
          <div>
            <h4 className="font-bold text-foreground mb-4 uppercase text-sm">OLDALAK</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Nyitóoldal</a></li>
              <li><a href="#regiok" className="hover:text-primary transition-colors">Régiók</a></li>
              <li><a href="#projektek" className="hover:text-primary transition-colors">Projektek</a></li>
              <li><a href="#rolunk" className="hover:text-primary transition-colors">Rólunk</a></li>
              <li><a href="#kapcsolat" className="hover:text-primary transition-colors">Kapcsolat</a></li>
              <li><a href="#galeria" className="hover:text-primary transition-colors">Galéria</a></li>
            </ul>
          </div>

          {/* Dokumentumok */}
          <div>
            <h4 className="font-bold text-foreground mb-4 uppercase text-sm">DOKUMENTUMOK</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">MIK alapszabály</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Alapító nyilatkozat</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Zárónyilatkozatok</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Beszámolók</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Jegyzőkönyvek</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Közlemények</a></li>
            </ul>
          </div>

          {/* HYCA Blog */}
          <div>
            <h4 className="font-bold text-foreground mb-4 uppercase text-sm">HYCA BLOG</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">HYCA Nyitóoldal</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Bejegyzések</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Szerzők</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Támogatás</a></li>
            </ul>
          </div>

          {/* Kapcsolat */}
          <div>
            <h4 className="font-bold text-foreground mb-4 uppercase text-sm">KAPCSOLAT</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <span className="block text-xs text-muted-foreground/70 uppercase tracking-wide">E-mail</span>
                <a
                  href="mailto:titkarsag@mikegyesulet.hu"
                  className="hover:text-primary transition-colors"
                >
                  titkarsag@mikegyesulet.hu
                </a>
              </li>
              <li>
                <span className="block text-xs text-muted-foreground/70 uppercase tracking-wide">Telefon</span>
                <a href="tel:+36309594595" className="hover:text-primary transition-colors">
                  +36 30 959 4595
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground text-center sm:text-left">
              © 2025 Magyar Ifjúsági Konferencia. Minden jog fenntartva.
            </p>
            <a 
              href="/admin" 
              className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              Admin
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
