import { Heart } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>
              MIK
            </h3>
            <p className="text-background/80 text-sm leading-relaxed">
              Magyar Ifjúsági Konferencia - A Kárpát-medence és a világ magyar ifjúságának egyeztetőfóruma.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Gyors Linkek</h4>
            <ul className="space-y-2 text-sm text-background/80">
              <li>
                <a href="#about" className="hover:text-background transition-colors">
                  Rólunk
                </a>
              </li>
              <li>
                <a href="#events" className="hover:text-background transition-colors">
                  Események
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-background transition-colors">
                  Kapcsolat
                </a>
              </li>
              <li>
                <a href="#join" className="hover:text-background transition-colors">
                  Csatlakozás
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Dokumentumok</h4>
            <ul className="space-y-2 text-sm text-background/80">
              <li>
                <a href="#" className="hover:text-background transition-colors">
                  Alapító Nyilatkozat
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-background transition-colors">
                  Zárónyilatkozatok
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-background transition-colors">
                  Szervezeti Struktúra
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-background/60">
          <p>© 2025 Magyar Ifjúsági Konferencia. Minden jog fenntartva.</p>
          <p className="flex items-center gap-1">
            Készítve <Heart className="h-4 w-4 text-accent inline" /> -val a magyar ifjúságért
          </p>
        </div>
      </div>
    </footer>
  );
};
