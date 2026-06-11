import { buildTranslationPrompt } from "./prompt";
import type { LanguageCode, ProviderId, TranslationMode, TranslationTone } from "./types";

export interface TranslateRequest {
  provider: ProviderId;
  apiKey: string;
  model: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  mode: TranslationMode;
  tone: TranslationTone;
  text: string;
  signal?: AbortSignal;
  customEndpoint?: string; // 選用自訂 API 端點
}

export class TranslationError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "TranslationError";
  }
}

export function buildOpenAiRequest(prompt: string, model: string) {
  return {
    model,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.2,
  };
}

export function buildCustomChatRequest(prompt: string, model: string) {
  return {
    model,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.2,
  };
}

export function buildGeminiRequest(prompt: string) {
  return {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
    },
  };
}

export async function translateText(request: TranslateRequest) {
  if (request.provider !== "custom" && !request.apiKey.trim()) {
    throw new TranslationError("請先設定目前供應商的 API key。");
  }
  if (!request.text.trim()) {
    throw new TranslationError("請輸入要翻譯的文字。");
  }

  const prompt = buildTranslationPrompt({
    sourceLanguage: request.sourceLanguage,
    targetLanguage: request.targetLanguage,
    mode: request.mode,
    tone: request.tone,
    text: request.text,
  });

  if (request.provider === "openai") {
    return translateWithOpenAi(prompt, request);
  }

  if (request.provider === "custom") {
    return translateWithCustom(prompt, request);
  }

  return translateWithGemini(prompt, request);
}

async function translateWithOpenAi(prompt: string, request: TranslateRequest) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${request.apiKey}`,
    },
    body: JSON.stringify(buildOpenAiRequest(prompt, request.model)),
    signal: request.signal,
  });

  const payload = await readJson(response);
  if (!response.ok) {
    throw normalizeProviderError(payload, response.status);
  }

  const outputText = payload.choices?.[0]?.message?.content;

  if (!outputText) {
    throw new TranslationError("OpenAI 回應中沒有可用的翻譯文字。", response.status);
  }

  return outputText.trim();
}

async function translateWithCustom(prompt: string, request: TranslateRequest) {
  const endpoint = request.customEndpoint || "https://api.openai.com/v1/chat/completions";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (request.apiKey.trim()) {
    headers["Authorization"] = `Bearer ${request.apiKey}`;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(buildCustomChatRequest(prompt, request.model)),
    signal: request.signal,
  });

  const payload = await readJson(response);
  if (!response.ok) {
    throw normalizeProviderError(payload, response.status);
  }

  // 標準 OpenAI chat completion 回傳格式
  const outputText = payload.choices?.[0]?.message?.content || payload.output_text;
  if (!outputText) {
    throw new TranslationError("自訂 API 回應中沒有可用的翻譯文字(choices[0].message.content)。", response.status);
  }

  return outputText.trim();
}

async function translateWithGemini(prompt: string, request: TranslateRequest) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    request.model,
  )}:generateContent?key=${encodeURIComponent(request.apiKey)}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildGeminiRequest(prompt)),
    signal: request.signal,
  });

  const payload = await readJson(response);
  if (!response.ok) {
    throw normalizeProviderError(payload, response.status);
  }

  const outputText = payload.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text)
    .filter(Boolean)
    .join("");

  if (!outputText) {
    throw new TranslationError("Gemini 回應中沒有可用的翻譯文字。", response.status);
  }

  return outputText.trim();
}

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function extractOpenAiOutput(payload: any) {
  return payload.output
    ?.flatMap((item: any) => item.content ?? [])
    ?.map((content: any) => content.text)
    ?.filter(Boolean)
    ?.join("");
}

function normalizeProviderError(payload: any, status: number) {
  const providerMessage = payload.error?.message ?? payload.message;
  if (status === 401 || status === 403) {
    return new TranslationError("API key 無效或沒有模型權限，請檢查設定。", status);
  }
  if (status === 429) {
    return new TranslationError("已達供應商速率或額度限制，請稍後重試或更換模型。", status);
  }
  if (typeof providerMessage === "string" && providerMessage.trim()) {
    return new TranslationError(providerMessage, status);
  }
  return new TranslationError("翻譯服務暫時無法完成請求。", status);
}

