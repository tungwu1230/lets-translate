import { getModel } from "./models";

const TOKEN_CHAR_RATIO = 3.6;

export function estimateTokens(text: string) {
  if (!text.trim()) return 0;
  return Math.max(1, Math.ceil(text.trim().length / TOKEN_CHAR_RATIO));
}

export function estimateCostUsd(modelId: string, input: string, output = "") {
  const model = getModel(modelId);
  const inputTokens = estimateTokens(input);
  const outputTokens = output ? estimateTokens(output) : Math.ceil(inputTokens * 1.15);
  return (
    (inputTokens / 1_000_000) * model.inputUsdPerMillion +
    (outputTokens / 1_000_000) * model.outputUsdPerMillion
  );
}

export function formatUsd(value: number) {
  if (value < 0.0001) return "<$0.0001";
  return `$${value.toFixed(4)}`;
}
