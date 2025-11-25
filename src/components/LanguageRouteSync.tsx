import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

export const LanguageRouteSync = () => {
  const location = useLocation();
  const { setLanguage } = useLanguage();

  useEffect(() => {
    if (location.pathname.startsWith("/en")) {
      setLanguage("en");
    } else {
      setLanguage("hu");
    }
  }, [location.pathname, setLanguage]);

  return null;
};
