import { loadSetting, saveSetting } from "./db";

const DEFAULT_SETTINGS = {
  apiMode: "online",
  apiUrl: import.meta.env.VITE_API_URL || "https://api.openai.com/v1",
  apiKey: import.meta.env.VITE_API_KEY || "",
  model: import.meta.env.VITE_MODEL || "gpt-3.5-turbo",
  systemPrompt: "",
  skin: "deepseek",
  form: "female",
  theme: "light",
  fontSize: 14,
  thinkingExpanded: true,
  userName: "",
  userGender: "",
  userAge: "",
  userZodiac: "",
  userMbti: "",
  userPersonality: "",
  userInterests: "",
  userJob: "",
  chatPref: "",
  userCustom: "",
  onboarded: false,
  sendKey: "enter",
};

const SETTINGS_KEY = "deep_settings";

export async function loadSettings() {
  const saved = await loadSetting(SETTINGS_KEY);
  return saved ? { ...DEFAULT_SETTINGS, ...saved } : { ...DEFAULT_SETTINGS };
}

export async function saveSettings(settings) {
  await saveSetting(SETTINGS_KEY, settings);
}

export function resolveApiConfig(settings) {
  if (settings?.apiMode === "online") {
    return {
      apiUrl: "/api",
      apiKey: "cf-proxy",
      model: settings.model || "",
    };
  }
  return {
    apiUrl: settings?.apiUrl || "",
    apiKey: settings?.apiKey || "",
    model: settings?.model || "",
  };
}

export function hasUsableApi(settings) {
  if (!settings) return false;
  if (settings.apiMode === "online") return true;
  return Boolean(settings.apiKey && settings.apiUrl);
}
