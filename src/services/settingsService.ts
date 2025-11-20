import mikLogo from "@/assets/mik-logo.svg";
import { readJson, writeJson } from "./storage";

type Setting = {
  label: string;
  value: string;
  type?: 'text' | 'textarea' | 'password';
  description?: string;
};

type SettingsStore = {
  general: Record<string, Setting>;
};

const STORAGE_KEY = "mik-settings";

const defaultSettings: SettingsStore = {
  general: {
    site_name: {
      label: "Oldal neve",
      value: "Magyar Ifjúsági Konferencia",
    },
    site_keywords: {
      label: "Kulcsszavak",
      value: "MIK, ifjúság, magyar, közösség",
      type: "textarea",
    },
    site_logo: {
      label: "Logó URL",
      value: mikLogo,
    },
    site_favicon: {
      label: "Favicon URL",
      value: mikLogo,
    },
  },
};

function loadSettings(): SettingsStore {
  const stored = readJson<SettingsStore>(STORAGE_KEY, defaultSettings);
  return {
    general: stored.general || defaultSettings.general,
  };
}

function persist(settings: SettingsStore) {
  writeJson(STORAGE_KEY, settings);
}

export function getSettings(): SettingsStore {
  return loadSettings();
}

export function updateSetting(
  category: keyof SettingsStore,
  key: string,
  value: string
) {
  const settings = loadSettings();
  if (!settings[category][key]) {
    settings[category][key] = { label: key, value };
  } else {
    settings[category][key].value = value;
  }
  persist(settings);
}

export type { Setting, SettingsStore };
