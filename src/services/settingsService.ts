import mikLogo from "@/assets/mik-logo.svg";
import { readJson, writeJson } from "./storage";

type SettingValue = string | boolean;

type Setting = {
  label: string;
  value: SettingValue;
  type?: 'text' | 'textarea' | 'password' | 'toggle';
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
    dev_banner_enabled: {
      label: "Fejlesztés alatt banner megjelenítése",
      value: true,
      type: "toggle",
      description: "Kapcsolja ki, ha nem szeretné megjeleníteni a fejlesztés alatt álló értesítést.",
    },
  },
};

function loadSettings(): SettingsStore {
  const stored = readJson<SettingsStore>(STORAGE_KEY, defaultSettings);
  return {
    general: {
      ...defaultSettings.general,
      ...(stored.general || {}),
    },
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
  value: SettingValue
) {
  const settings = loadSettings();
  if (!settings[category][key]) {
    settings[category][key] = { label: key, value };
  } else {
    settings[category][key].value = value;
  }
  persist(settings);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("mik-settings-updated", { detail: settings }));
  }
}

export type { Setting, SettingsStore };
