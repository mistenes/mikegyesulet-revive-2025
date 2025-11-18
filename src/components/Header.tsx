import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Globe } from "lucide-react";
import mikLogo from "@/assets/mik-logo.svg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();

  const navItems = [
    { label: t('nav.about'), href: "/rolunk" },
    { label: t('nav.regions'), href: "/regiok" },
    { label: t('nav.documents'), href: "/dokumentumok" },
    { label: t('nav.contact'), href: "/kapcsolat" },
    { label: t('nav.gallery'), href: "/galeria" },
    { label: t('nav.projects'), href: "/projektek" },
  ];

  const isActive = (href: string) => {
    if (href.startsWith('/#')) {
      return location.pathname === '/' && location.hash === href.substring(1);
    }
    return location.pathname === href;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img src={mikLogo} alt="MIK Logo" className="h-16 w-auto transition-transform duration-300 group-hover:scale-105" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              item.href.startsWith('/#') ? (
                <a
                  key={item.label}
                  href={item.href}
                  className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                    isActive(item.href) ? 'text-primary' : 'text-foreground hover:text-primary'
                  }`}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                    isActive(item.href) ? 'text-primary' : 'text-foreground hover:text-primary'
                  }`}
                >
                  {item.label}
                </Link>
              )
            ))}
            
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors focus:outline-none">
                <Globe className="h-4 w-4" />
                <span>{language === 'hu' ? 'Magyar' : 'English'}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border z-[100]">
                <DropdownMenuItem 
                  onClick={() => setLanguage('hu')}
                  className={`cursor-pointer ${language === 'hu' ? 'bg-accent' : ''}`}
                >
                  Magyar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setLanguage('en')}
                  className={`cursor-pointer ${language === 'en' ? 'bg-accent' : ''}`}
                >
                  English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
              item.href.startsWith('/#') ? (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 text-sm font-medium transition-all ${
                    isActive(item.href) 
                      ? 'text-primary bg-accent/50' 
                      : 'text-foreground hover:text-primary hover:bg-muted/50'
                  }`}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 text-sm font-medium transition-all ${
                    isActive(item.href) 
                      ? 'text-primary bg-accent/50' 
                      : 'text-foreground hover:text-primary hover:bg-muted/50'
                  }`}
                >
                  {item.label}
                </Link>
              )
            ))}
            
            {/* Mobile Language Switcher */}
            <div className="px-4 py-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <Globe className="h-4 w-4" />
                <span>Language</span>
              </div>
              <button
                onClick={() => {
                  setLanguage('hu');
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-3 py-2 text-sm rounded ${
                  language === 'hu' ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                }`}
              >
                Magyar
              </button>
              <button
                onClick={() => {
                  setLanguage('en');
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-3 py-2 text-sm rounded ${
                  language === 'en' ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                }`}
              >
                English
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
