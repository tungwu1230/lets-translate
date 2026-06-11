import { describe, expect, it } from "vitest";
import { buildGeminiRequest, buildOpenAiRequest } from "./provider";

describe("provider request builders", () => {
  it("builds an OpenAI Chat Completion request", () => {
    const request = buildOpenAiRequest("Translate this", "gpt-5.4-nano");
    expect(request.model).toBe("gpt-5.4-nano");
    expect(request.messages[0].content).toBe("Translate this");
  });

  it("builds a Gemini generateContent request", () => {
    const request = buildGeminiRequest("Translate this");
    expect(request.contents[0].parts[0].text).toBe("Translate this");
    expect(request.generationConfig.temperature).toBe(0.2);
  });
});
