export type Persona = {
  id: string;
  name: string;
  title: string;
  blurb: string;
  accent: string; // css color used for the avatar aura
  voiceHint: string[]; // preferred browser voice name fragments
  pitch: number;
  rate: number;
};

export const PERSONAS: Persona[] = [
  {
    id: "aria",
    name: "Aria",
    title: "Engineering Manager",
    blurb: "Warm but rigorous. Digs into how you think, not just what you know.",
    accent: "oklch(0.66 0.19 291)",
    voiceHint: ["samantha", "female", "google uk english female", "zira"],
    pitch: 1.05,
    rate: 1,
  },
  {
    id: "dev",
    name: "Dev",
    title: "Senior Backend Engineer",
    blurb: "Direct and technical. Expects tradeoffs, not buzzwords.",
    accent: "oklch(0.66 0.19 258)",
    voiceHint: ["daniel", "male", "google uk english male", "david"],
    pitch: 0.92,
    rate: 1.02,
  },
  {
    id: "maya",
    name: "Maya",
    title: "HR Business Partner",
    blurb: "Conversational and people-focused. Great for HR and behavioural rounds.",
    accent: "oklch(0.72 0.16 158)",
    voiceHint: ["karen", "victoria", "female"],
    pitch: 1.12,
    rate: 0.98,
  },
];

export function getPersona(id?: string | null) {
  return PERSONAS.find((p) => p.id === id) ?? PERSONAS[0];
}
