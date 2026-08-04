const OPENAI_MODERATION_URL = "https://api.openai.com/v1/moderations";
const OPENAI_MODERATION_MODEL = "omni-moderation-latest";

import { containsProfanity, findProfanity } from "./profanity";

const BLOCKING_OPENAI_CATEGORIES = new Set([
  "hate",
  "hate/threatening",
  "self-harm",
  "sexual/minors",
  "violence",
  "violence/graphic",
  "harassment/threats",
  "harassment/self-harm",
]);

interface OpenAIModerationResult {
  flagged: boolean;
  categories: Record<string, boolean>;
  category_scores: Record<string, number>;
}

interface OpenAIModerationResponse {
  id: string;
  model: string;
  results: OpenAIModerationResult[];
}

function findExplicitProfanity(text: string): string[] {
  return findProfanity(text);
}

function getBlockingOpenAICategories(categories: Record<string, boolean>): string[] {
  return Object.entries(categories)
    .filter(([category, value]) => value)
    .map(([category]) => category)
    .filter((category) => BLOCKING_OPENAI_CATEGORIES.has(category));
}

export async function moderateText(text: string): Promise<void> {
  const explicitSwears = findExplicitProfanity(text);
  if (explicitSwears.length) {
    console.log("failed regex, not doing openai content moderation");
    throw new Error(
      "Content contains disallowed profanity. Please remove explicit language and try again.",
    );
  }

  console.log("passed regex check, and now checking openai moderation");

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("OPENAI_API_KEY is not configured; skipping moderation check.");
    return;
  }

  try {
    const response = await fetch(OPENAI_MODERATION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODERATION_MODEL,
        input: text,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI moderation request failed:", response.status, await response.text());
      return;
    }

    const data = (await response.json()) as OpenAIModerationResponse;
    const result = data.results?.[0];
    if (!result) {
      return;
    }

    if (!result.flagged) {
      return;
    }

    const blockedCategories = getBlockingOpenAICategories(result.categories ?? {});
    if (blockedCategories.length) {
      throw new Error(
        "Content violates moderation policy. Please remove disallowed language and try again.",
      );
    }
  } catch (error) {
    console.error("Unable to complete OpenAI moderation request:", error);
    return;
  }
}
