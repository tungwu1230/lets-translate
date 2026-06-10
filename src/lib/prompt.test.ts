import { describe, expect, it } from "vitest";
import { buildTranslationPrompt } from "./prompt";

describe("buildTranslationPrompt", () => {
  it("asks the model to only return translated text", () => {
    const prompt = buildTranslationPrompt({
      sourceLanguage: "en",
      targetLanguage: "zh-Hant",
      mode: "business",
      tone: "formal",
      text: "Thanks for your reply.",
    });

    expect(prompt).toContain("Translate from 英文 to 繁體中文");
    expect(prompt).toContain("Return only the translated text");
    expect(prompt).toContain("Thanks for your reply.");
  });
});
