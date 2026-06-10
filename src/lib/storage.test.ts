import { describe, expect, it } from "vitest";
import { defaultProviderSettings, loadProviderSettings, saveProviderSettings, updateProviderKey } from "./storage";

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
  it("does not persist keys when rememberKeys is false", () => {
    const storage = createStorage();
    saveProviderSettings(
      updateProviderKey({ ...defaultProviderSettings, rememberKeys: false }, "openai", "sk-test"),
      storage,
    );
    expect(loadProviderSettings(storage).apiKeys.openai).toBe("");
  });

  it("persists keys when rememberKeys is true", () => {
    const storage = createStorage();
    saveProviderSettings(
      updateProviderKey({ ...defaultProviderSettings, rememberKeys: true }, "gemini", "gm-test"),
      storage,
    );
    expect(loadProviderSettings(storage).apiKeys.gemini).toBe("gm-test");
  });
});
