// Swappable AI provider adapter. The rest of the app only talks to `chatJSON`.
// Today: Lovable AI Gateway (OpenAI-compatible). Swap this file to change vendor.

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.7-flash";

export class AIProviderError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function friendly(status: number, message: string) {
  if (status === 429) return "The AI interviewer is rate limited right now. Please wait a moment and try again.";
  if (status === 402) return "AI credits have run out for this workspace. Add credits in Lovable to continue.";
  if (status === 403) return "AI access is blocked for this workspace. Please check your Lovable AI settings.";
  return message || "The AI interviewer is temporarily unavailable.";
}

async function callGateway(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AIProviderError("AI is not configured (missing API key).", 401);

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    let message = body;
    try {
      message = (JSON.parse(body).error?.message as string) ?? body;
    } catch {
      /* keep raw */
    }
    throw new AIProviderError(friendly(res.status, message), res.status);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}

function extractJSON<T>(raw: string): T {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) return JSON.parse(cleaned.slice(start, end + 1)) as T;
    throw new AIProviderError("The AI interviewer returned an unreadable response.", 502);
  }
}

/** Calls the provider and parses a JSON object response. Retries once on transient failure. */
export async function chatJSON<T>(messages: ChatMessage[]): Promise<T> {
  try {
    return extractJSON<T>(await callGateway(messages));
  } catch (error) {
    const status = error instanceof AIProviderError ? error.status : 500;
    if (status === 402 || status === 401 || status === 403) throw error;
    await new Promise((r) => setTimeout(r, 700));
    return extractJSON<T>(await callGateway(messages));
  }
}
