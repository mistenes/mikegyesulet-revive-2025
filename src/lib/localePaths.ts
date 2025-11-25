import type { Language } from "@/contexts/LanguageContext";

const EN_PREFIX = "/en";

export const stripLocalePrefix = (path: string) => {
  if (path.startsWith(EN_PREFIX)) {
    const stripped = path.slice(EN_PREFIX.length);
    return stripped.length > 0 ? stripped : "/";
  }
  return path;
};

export const getLocalizedPath = (path: string, language: Language) => {
  if (/^[a-zA-Z]+:\/\//.test(path) || path.startsWith("mailto:")) {
    return path;
  }

  if (language === "en") {
    if (path === EN_PREFIX || path === `${EN_PREFIX}/`) {
      return EN_PREFIX;
    }

    if (path.startsWith(EN_PREFIX)) {
      return path;
    }

    if (path === "/") {
      return EN_PREFIX;
    }

    return `${EN_PREFIX}${path.startsWith("/") ? "" : "/"}${path.replace(/^\//, "")}`;
  }

  return stripLocalePrefix(path);
};
