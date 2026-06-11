import { describe, expect, it } from "vitest";
import { defaultProviderSettings, loadProviderSettings, saveProviderSettings, updateProviderKey, loadFavoritePairs, saveFavoritePairs } from "./storage";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    get length() {
      return values.size;
    },
  } as Storage;
}

describe("storage", () => {
  it("does not persist keys and settings when rememberKeys is false", () => {
    const storage = createStorage();
    saveProviderSettings(
      updateProviderKey({ ...defaultProviderSettings, rememberKeys: false }, "openai", "sk-test"),
      storage,
    );
    expect(loadProviderSettings(storage).apiKeys.openai).toBe("");
  });

  it("persists keys and settings when rememberKeys is true", () => {
    const storage = createStorage();
    const settings = {
      ...defaultProviderSettings,
      rememberKeys: true,
      provider: "gemini" as const,
      model: { openai: "gpt-5.5", gemini: "gemini-2.5-flash", custom: "my-model" },
      mode: "business" as const,
      tone: "formal" as const,
    };
    saveProviderSettings(settings, storage);
    
    const loaded = loadProviderSettings(storage);
    expect(loaded.rememberKeys).toBe(true);
    expect(loaded.provider).toBe("gemini");
    expect(loaded.model.openai).toBe("gpt-5.5");
    expect(loaded.model.gemini).toBe("gemini-2.5-flash");
    expect(loaded.mode).toBe("business");
    expect(loaded.tone).toBe("formal");
  });

  it("loads default favorite pairs when storage is empty", () => {
    const storage = createStorage();
    const loaded = loadFavoritePairs(storage);
    expect(loaded.length).toBe(3);
    expect(loaded[0].sourceLanguage).toBe("zh-Hant");
    expect(loaded[0].targetLanguage).toBe("en");
  });

  it("saves and loads custom favorite pairs", () => {
    const storage = createStorage();
    const customPairs = [
      { id: "fav-1", sourceLanguage: "auto" as const, targetLanguage: "fr" as const }
    ];
    saveFavoritePairs(customPairs, storage);
    const loaded = loadFavoritePairs(storage);
    expect(loaded.length).toBe(1);
    expect(loaded[0].id).toBe("fav-1");
    expect(loaded[0].sourceLanguage).toBe("auto");
    expect(loaded[0].targetLanguage).toBe("fr");
  });
});

