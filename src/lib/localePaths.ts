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

  const [pathname, hash = ""] = path.split("#");
  const normalizedPath = pathname || "/";

  const localizedPath = (() => {
    if (language === "en") {
      if (normalizedPath === EN_PREFIX || normalizedPath === `${EN_PREFIX}/`) {
        return EN_PREFIX;
      }

      if (normalizedPath.startsWith(EN_PREFIX)) {
        return normalizedPath;
      }

      if (normalizedPath === "/") {
        return EN_PREFIX;
      }

      const trimmedPath = normalizedPath.replace(/^\/+/, "");
      return trimmedPath ? `${EN_PREFIX}/${trimmedPath}` : EN_PREFIX;
    }

    return stripLocalePrefix(normalizedPath);
  })();

  if (hash) {
    const separator = localizedPath.endsWith("/") ? "" : "/";
    return `${localizedPath}${separator}#${hash}`;
  }

  return localizedPath;
};
