/**
 * Swappable talking-avatar adapter (client side playback surface).
 *
 * MVP: MOCK provider — an animated persona tile driven by the browser speech
 * synthesis engine (Web Speech API, zero cost, no API key), with viseme-ish
 * mouth animation synced to speech boundaries.
 *
 * ===========================================================================
 * EXTENSION POINT — live video avatar (D-ID / HeyGen / Tavus), NOT built yet.
 * Implement a function with this exact signature:
 *
 *   createAvatarSession(personaId: string, events: AvatarEvents, options?: AvatarOptions): AvatarSession
 *
 * mint the provider stream in a server function, play it here, and keep
 * `speak/stop/supported`. Nothing else in the app needs to change.
 * ===========================================================================
 */
import { getPersona } from "./personas";
import { TTS_ENABLED, pickVoice, voiceProfile } from "./voiceStyles";

export type AvatarSession = {
  speak: (text: string) => Promise<void>;
  stop: () => void;
  supported: boolean;
};

export type AvatarEvents = {
  onStart?: () => void;
  onWord?: (spokenSoFar: string) => void;
  onEnd?: () => void;
};

export type AvatarOptions = {
  /** `voice_style` column of the selected avatar row. */
  voiceStyle?: string | null;
  /** "en" | "hinglish" */
  language?: string | null;
  /** When true, captions still animate but no audio is produced. */
  muted?: boolean;
};

export function createAvatarSession(
  personaId: string,
  events: AvatarEvents = {},
  options: AvatarOptions = {},
): AvatarSession {
  const persona = getPersona(personaId);
  const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
  const profile = options.voiceStyle
    ? voiceProfile(options.voiceStyle, options.language)
    : { hints: persona.voiceHint, pitch: persona.pitch, rate: persona.rate };

  const audioOn = () => TTS_ENABLED && !options.muted && Boolean(synth);

  /** Caption-only pacing: used when muted or when TTS is unavailable. */
  function paceCaptions(text: string, resolve: () => void) {
    events.onStart?.();
    let i = 0;
    const step = Math.max(2, Math.round(text.length / 60));
    const timer = setInterval(() => {
      i += step;
      events.onWord?.(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        events.onWord?.(text);
        events.onEnd?.();
        resolve();
      }
    }, 60);
  }

  return {
    supported: Boolean(synth) && TTS_ENABLED,
    stop: () => synth?.cancel(),
    speak: (text: string) =>
      new Promise<void>((resolve) => {
        if (!audioOn()) {
          // Graceful degradation: the interview never blocks on speech.
          paceCaptions(text, resolve);
          return;
        }

        synth!.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voice = pickVoice(synth!.getVoices(), profile, options.language);
        if (voice) utterance.voice = voice;
        if (options.language === "hinglish" && voice?.lang?.toLowerCase().startsWith("hi")) {
          utterance.lang = voice.lang;
        }
        utterance.pitch = profile.pitch;
        utterance.rate = profile.rate;

        let finished = false;
        const finish = () => {
          if (finished) return;
          finished = true;
          events.onEnd?.();
          resolve();
        };

        utterance.onstart = () => events.onStart?.();
        utterance.onboundary = (e) => events.onWord?.(text.slice(0, e.charIndex + e.charLength));
        utterance.onend = finish;
        utterance.onerror = () => {
          // Speech failed mid-way — fall back to captions so the flow continues.
          finish();
        };

        events.onStart?.();
        synth!.speak(utterance);
        // Safety net: some browsers never fire onend for long utterances.
        setTimeout(finish, Math.max(8000, text.length * 90));
      }),
  };
}
