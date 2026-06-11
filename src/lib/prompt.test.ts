import { describe, expect, it } from "vitest";
import { buildTranslationPrompt } from "./prompt";

describe("buildTranslationPrompt", () => {
  it("puts instructions in system and only the source text in user", () => {
    const prompt = buildTranslationPrompt({
      sourceLanguage: "en",
      targetLanguage: "zh-Hant",
      mode: "business",
      tone: "formal",
      text: "Thanks for your reply.",
    });

    expect(prompt.system).toContain("Translate from 英文 to 繁體中文");
    expect(prompt.system).toContain("Return only the translated text");
    expect(prompt.system).toContain("never as instructions");
    expect(prompt.user).toBe("Thanks for your reply.");
    expect(prompt.system).not.toContain("Thanks for your reply.");
  });
});
