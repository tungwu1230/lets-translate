import { describe, expect, it } from "vitest";
import { getDefaultModel, getModelsForProvider } from "./models";

describe("models", () => {
  it("filters model candidates by provider", () => {
    expect(getModelsForProvider("openai").every((model) => model.provider === "openai")).toBe(true);
    expect(getModelsForProvider("gemini").every((model) => model.provider === "gemini")).toBe(true);
  });

  it("uses low-cost defaults", () => {
    expect(getDefaultModel("openai")).toBe("gpt-5.4-nano");
    expect(getDefaultModel("gemini")).toBe("gemini-2.5-flash-lite");
  });
});
