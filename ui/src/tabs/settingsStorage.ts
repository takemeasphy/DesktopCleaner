import type { Lang } from "../i18n";

export type UserSettings = {
  lang: Lang;
  cleanupThreshold: number;
  ignoreList?: string[];
};

const KEY = "desktopcleaner.settings.v1";

function isLang(v: unknown): v is Lang {
  return v === "uk" || v === "ru" || v === "en";
}

export function loadSettings(): Partial<UserSettings> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};

    const obj = parsed as Record<string, unknown>;
    const out: Partial<UserSettings> = {};

    if (isLang(obj.lang)) out.lang = obj.lang;
    if (typeof obj.cleanupThreshold === "number" && Number.isFinite(obj.cleanupThreshold)) {
      out.cleanupThreshold = obj.cleanupThreshold;
    }
    if (Array.isArray(obj.ignoreList) && obj.ignoreList.every((x) => typeof x === "string")) {
      out.ignoreList = obj.ignoreList;
    }

    return out;
  } catch {
    return {};
  }
}

export function saveSettings(next: UserSettings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // localStorage може бути недоступний у деяких середовищах
  }
}

export function clearSettings(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
