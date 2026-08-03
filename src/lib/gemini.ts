const GEMINI_EMBEDDING_MODEL = "gemini-embedding-2";
const EMBEDDING_DIMENSIONS = 768;

interface GeminiEmbeddingResponse {
  embedding?: {
    values?: number[];
  };
}

/**
 * Returns a 768-dimensional Gemini embedding, or null when embedding is
 * unavailable. Callers should always treat embeddings as an enhancement.
 */
export async function getEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("GEMINI_API_KEY is not configured; skipping embedding.");
    return null;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBEDDING_MODEL}:embedContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          content: { parts: [{ text }] },
          output_dimensionality: EMBEDDING_DIMENSIONS,
        }),
      },
    );

    if (!response.ok) {
      console.error("Gemini embedding request failed:", response.status, await response.text());
      return null;
    }

    const data = (await response.json()) as GeminiEmbeddingResponse;
    const embedding = data.embedding?.values;

    if (!embedding || embedding.length !== EMBEDDING_DIMENSIONS) {
      console.error("Gemini returned an embedding with an unexpected dimension.");
      return null;
    }

    return embedding;
  } catch (error) {
    console.error("Unable to generate Gemini embedding:", error);
    return null;
  }
}

export function embeddingToVectorLiteral(embedding: number[]): string {
  if (embedding.length !== EMBEDDING_DIMENSIONS || embedding.some((value) => !Number.isFinite(value))) {
    throw new Error("Expected a finite 768-dimensional embedding.");
  }

  return `[${embedding.join(",")}]`;
}
