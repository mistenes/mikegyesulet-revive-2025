import { readJson, writeJson } from "./storage";

type Setting = {
  label: string;
  value: string;
  type?: 'text' | 'textarea' | 'password';
  description?: string;
};

type SettingsStore = {
  general: Record<string, Setting>;
  integrations: Record<string, Setting>;
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
      value: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop",
    },
  },
  integrations: {
    mapbox_token: {
      label: "Mapbox token",
      value: "",
      type: "password",
      description: "Add meg a Mapbox hozzáférési tokenedet a térkép megjelenítéséhez.",
    },
    render_service_name: {
      label: "Render szolgáltatás neve",
      value: "mik-frontend",
    },
    render_api_base_url: {
      label: "API alap URL",
      value: "",
      description: "Állítsd be azt az URL-t, ahol a Renderen futó API kiszolgálja az admin felületet.",
    },
    postgres_connection_url: {
      label: "Postgres kapcsolat",
      value: "",
      type: "password",
      description: "A Render által biztosított Postgres adatbázis elérhetősége.",
    },
  },
};

function loadSettings(): SettingsStore {
  return readJson<SettingsStore>(STORAGE_KEY, defaultSettings);
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
