const isBrowser = typeof window !== 'undefined';

export function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  const value = window.localStorage.getItem(key);
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`Failed to parse localStorage key ${key}`, error);
    return fallback;
  }
}

export function writeJson(key: string, value: unknown) {
  if (!isBrowser) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}
