import { getLanguageLabel, modeOptions, toneOptions } from "./models";
import type { LanguageCode, TranslationMode, TranslationTone } from "./types";

interface PromptInput {
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  mode: TranslationMode;
  tone: TranslationTone;
  text: string;
}

export function buildTranslationPrompt({
  sourceLanguage,
  targetLanguage,
  mode,
  tone,
  text,
}: PromptInput) {
  const source = sourceLanguage === "auto" ? "the detected source language" : getLanguageLabel(sourceLanguage);
  const target = getLanguageLabel(targetLanguage);
  const modeLabel = modeOptions.find((option) => option.id === mode)?.description ?? mode;
  const toneLabel = toneOptions.find((option) => option.id === tone)?.label ?? tone;

  return [
    "You are a professional translation engine.",
    `Translate from ${source} to ${target}.`,
    `Mode: ${modeLabel}. Tone: ${toneLabel}.`,
    "Return only the translated text. Do not explain, summarize, add quotes, or wrap the result in markdown.",
    "Preserve paragraph breaks, punctuation, numbers, names, placeholders, URLs, and code-like tokens.",
    "If the source includes ambiguity, choose the most natural translation for the requested mode.",
    "",
    "Source text:",
    text,
  ].join("\n");
}
