import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import mikLogo from "@/assets/mik-logo.svg";

export const Footer = () => {
  return (
    <footer className="bg-muted/30 py-16">
      <div className="container px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Logo & Info */}
          <div className="lg:col-span-1">
            <div className="flex flex-col items-start gap-4 mb-4">
              <img
                src={mikLogo}
                alt="Magyar Ifjúsági Konferencia"
                className="h-16 w-auto"
              />
              <span
                className="text-xl font-bold text-foreground leading-tight"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                MAGYAR IFJÚSÁGI
                <br />
                KONFERENCIA
              </span>
            </div>
            <div className="flex gap-3">
              <a
                href="https://www.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://www.youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Oldalak */}
          <div>
            <h4 className="font-bold text-foreground mb-4 uppercase text-sm">OLDALAK</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-primary transition-colors">
                  Nyitóoldal
                </Link>
              </li>
              <li>
                <Link to="/regiok" className="hover:text-primary transition-colors">
                  Régiók
                </Link>
              </li>
              <li>
                <Link to="/projektek" className="hover:text-primary transition-colors">
                  Projektek
                </Link>
              </li>
              <li>
                <Link to="/rolunk" className="hover:text-primary transition-colors">
                  Rólunk
                </Link>
              </li>
              <li>
                <Link to="/kapcsolat" className="hover:text-primary transition-colors">
                  Kapcsolat
                </Link>
              </li>
              <li>
                <Link to="/galeria" className="hover:text-primary transition-colors">
                  Galéria
                </Link>
              </li>
            </ul>
          </div>

          {/* Dokumentumok */}
          <div>
            <h4 className="font-bold text-foreground mb-4 uppercase text-sm">DOKUMENTUMOK</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link to="/dokumentumok" className="hover:text-primary transition-colors">
                  MIK alapszabály
                </Link>
              </li>
              <li>
                <Link to="/dokumentumok" className="hover:text-primary transition-colors">
                  Alapító nyilatkozat
                </Link>
              </li>
              <li>
                <Link to="/dokumentumok" className="hover:text-primary transition-colors">
                  Zárónyilatkozatok
                </Link>
              </li>
              <li>
                <Link to="/dokumentumok" className="hover:text-primary transition-colors">
                  Beszámolók
                </Link>
              </li>
              <li>
                <Link to="/dokumentumok" className="hover:text-primary transition-colors">
                  Jegyzőkönyvek
                </Link>
              </li>
              <li>
                <Link to="/dokumentumok" className="hover:text-primary transition-colors">
                  Közlemények
                </Link>
              </li>
            </ul>
          </div>

          {/* HYCA Blog */}
          <div>
            <h4 className="font-bold text-foreground mb-4 uppercase text-sm">HYCA BLOG</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://hyca.hu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  HYCA Nyitóoldal
                </a>
              </li>
              <li>
                <a
                  href="https://hyca.hu/bejegyzesek"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Bejegyzések
                </a>
              </li>
              <li>
                <a
                  href="https://hyca.hu/szerzok"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Szerzők
                </a>
              </li>
              <li>
                <a
                  href="https://hyca.hu/tamogatas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Támogatás
                </a>
              </li>
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
