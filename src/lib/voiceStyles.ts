/**
 * Feature 2 — voice configuration for the mock talking avatar.
 *
 * Zero-cost: everything here maps an avatar's `voice_style` column onto a
 * browser SpeechSynthesis voice + pitch + rate, so each persona sounds
 * distinct without any paid API.
 *
 * EXTENSION POINT: a real live-video avatar provider (D-ID / HeyGen / Tavus)
 * would consume the same VoiceProfile — see `createAvatarSession` in
 * avatarProvider.ts, whose signature is provider-agnostic on purpose.
 */

export type VoiceProfile = {
  /** Ordered browser-voice name fragments, best match first. */
  hints: string[];
  pitch: number;
  rate: number;
};

/** Global kill switch — flip to false to disable avatar speech app-wide. */
export const TTS_ENABLED = true;

const STYLES: Record<string, VoiceProfile> = {
  "warm-female": { hints: ["samantha", "aria", "zira", "google uk english female", "female"], pitch: 1.12, rate: 0.98 },
  "calm-female": { hints: ["karen", "victoria", "google us english", "female"], pitch: 1.0, rate: 0.92 },
  "deep-male": { hints: ["daniel", "david", "google uk english male", "male"], pitch: 0.82, rate: 1.0 },
  "bright-male": { hints: ["alex", "fred", "google us english", "male"], pitch: 1.0, rate: 1.12 },
  neutral: { hints: ["google us english", "samantha", "david"], pitch: 1, rate: 1 },
};

/** Hindi-capable voices, used when the interview runs in Hinglish. */
const HINDI_HINTS = ["hindi", "hi-in", "lekha", "google हिन्दी", "kalpana", "swara", "madhur"];

export function voiceProfile(style?: string | null, language?: string | null): VoiceProfile {
  const base = STYLES[style ?? "neutral"] ?? STYLES["neutral"]!;
  if ((language ?? "en") !== "hinglish") return base;
  // Hindi voice first; the English hints stay as a graceful fallback.
  return { ...base, hints: [...HINDI_HINTS, ...base.hints] };
}

export function pickVoice(
  voices: SpeechSynthesisVoice[],
  profile: VoiceProfile,
  language?: string | null,
): SpeechSynthesisVoice | undefined {
  for (const hint of profile.hints) {
    const match = voices.find(
      (v) => v.name.toLowerCase().includes(hint) || v.lang.toLowerCase().includes(hint),
    );
    if (match) return match;
  }
  if ((language ?? "en") === "hinglish") {
    const hindi = voices.find((v) => v.lang.toLowerCase().startsWith("hi"));
    if (hindi) return hindi;
  }
  return voices.find((v) => v.lang.toLowerCase().startsWith("en"));
}
