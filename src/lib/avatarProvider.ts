/**
 * Swappable talking-avatar adapter (client side playback surface).
 *
 * MVP: MOCK provider — an animated persona tile driven by the browser speech
 * synthesis engine, with viseme-ish mouth animation synced to speech boundaries.
 * No third-party avatar key exists in this environment.
 *
 * To plug in D-ID / HeyGen / Tavus later: implement the same AvatarSession
 * interface (server function mints the provider stream/session, this module
 * only plays it) and swap `createAvatarSession`. Nothing else in the app
 * needs to change.
 */
import { getPersona } from "./personas";

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

export function createAvatarSession(personaId: string, events: AvatarEvents = {}): AvatarSession {
  const persona = getPersona(personaId);
  const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;

  function pickVoice() {
    if (!synth) return undefined;
    const voices = synth.getVoices();
    for (const hint of persona.voiceHint) {
      const match = voices.find((v) => v.name.toLowerCase().includes(hint));
      if (match) return match;
    }
    return voices.find((v) => v.lang.startsWith("en"));
  }

  return {
    supported: Boolean(synth),
    stop: () => synth?.cancel(),
    speak: (text: string) =>
      new Promise<void>((resolve) => {
        if (!synth) {
          // Fallback: no audio available — still pace the caption so the UI
          // never hard-fails when speech synthesis is missing.
          events.onStart?.();
          const done = () => {
            events.onWord?.(text);
            events.onEnd?.();
            resolve();
          };
          setTimeout(done, Math.min(6000, text.length * 35));
          return;
        }

        synth.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voice = pickVoice();
        if (voice) utterance.voice = voice;
        utterance.pitch = persona.pitch;
        utterance.rate = persona.rate;

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
        utterance.onerror = finish;

        events.onStart?.();
        synth.speak(utterance);
        // Safety net: some browsers never fire onend for long utterances.
        setTimeout(finish, Math.max(8000, text.length * 90));
      }),
  };
}
