import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import puzzleLogo from "@/assets/puzzle-logo.png";

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "RÓLUNK", href: "#rolunk" },
    { label: "RÉGIÓK", href: "#regiok" },
    { label: "DOKUMENTUMOK", href: "#dokumentumok" },
    { label: "KAPCSOLAT", href: "#kapcsolat" },
    { label: "GALÉRIA", href: "#galeria" },
    { label: "PROJEKTEK", href: "#projektek" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 group">
            <img src={puzzleLogo} alt="MIK Logo" className="h-12 w-12 transition-transform duration-300 group-hover:scale-110" />
            <span className="text-xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
              MIK
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors duration-200"
              >
                {item.label}
              </a>
            ))}
            <div className="flex items-center gap-1 px-4 py-2 cursor-pointer hover:text-primary transition-colors">
              <span className="text-sm font-medium">Magyar</span>
              <ChevronDown className="h-4 w-4" />
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-foreground hover:text-primary transition-colors"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-border">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-sm font-medium text-foreground hover:text-primary hover:bg-muted/50 transition-all"
              >
                {item.label}
              </a>
            ))}
            <div className="px-4 py-3 text-sm font-medium flex items-center gap-2">
              <span>Magyar</span>
              <ChevronDown className="h-4 w-4" />
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
