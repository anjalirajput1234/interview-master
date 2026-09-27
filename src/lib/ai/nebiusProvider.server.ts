// NVIDIA Nemotron via Nebius Token Factory (OpenAI-compatible chat completions).
// Server-only: reads NEBIUS_API_KEY inside the call, never exposed to the browser.
import type { ChatMessage } from "./aiProvider.server";

export type NebiusTier = "fast" | "deep";

const DEFAULT_URL = "https://api.studio.nebius.com/v1/chat/completions";
// Overridable via env so exact catalogue IDs can be changed without code edits.
const DEFAULT_FAST_MODEL = "nvidia/nemotron-3-nano";
const DEFAULT_DEEP_MODEL = "nvidia/nemotron-3-super";

export class NebiusError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function isNebiusEnabled() {
  return (process.env["AI_PROVIDER"] ?? "").toLowerCase() === "nebius" && !!process.env["NEBIUS_API_KEY"];
}

/** Raw chat call to Nebius; returns the assistant text. */
export async function nebiusChat(messages: ChatMessage[], tier: NebiusTier = "fast"): Promise<string> {
  const apiKey = process.env["NEBIUS_API_KEY"];
  if (!apiKey) throw new NebiusError("NEBIUS_API_KEY is not set", 401);
  const url = process.env["NEBIUS_API_URL"] || DEFAULT_URL;
  const model =
    tier === "deep"
      ? process.env["NEBIUS_DEEP_MODEL"] || DEFAULT_DEEP_MODEL
      : process.env["NEBIUS_FAST_MODEL"] || DEFAULT_FAST_MODEL;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, response_format: { type: "json_object" } }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new NebiusError(`Nebius ${res.status}: ${body.slice(0, 300)}`, res.status);
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content ?? "";
  if (!text) throw new NebiusError("Nebius returned an empty response", 502);
  return text;
}
