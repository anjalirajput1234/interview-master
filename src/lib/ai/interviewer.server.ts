// Interview state machine orchestration.
import { chatJSON, type ChatMessage } from "./aiProvider.server";
import {
  FINAL_EVALUATION_INSTRUCTION,
  FIRST_QUESTION_INSTRUCTION,
  TURN_INSTRUCTION,
  personaPrompt,
  questionBankHint,
  type InterviewConfig,
} from "./promptTemplates.server";

export type BankQuestion = {
  text: string;
  category: string;
  difficulty: string;
  expected_concepts: string[];
};

export type TranscriptEntry = { sender: string; message_text: string };

export type FirstTurn = { reply: string; nextCategory?: string; nextDifficulty?: string };

export type Turn = {
  evaluation?: { score?: number; category?: string; strength?: string; gap?: string };
  reply: string;
  nextCategory?: string;
  nextDifficulty?: string;
  shouldEnd?: boolean;
};

export type FinalReport = {
  overallScore: number;
  categoryScores: Record<string, number>;
  strengths: string[];
  areasToImprove: string[];
  recommendedTopics: string[];
  aiFeedbackSummary: string;
};

/** Rough question budget derived from the configured duration. */
export function questionBudget(durationMinutes: number) {
  return Math.max(4, Math.min(20, Math.round(durationMinutes / 2.5)));
}

export async function generateFirstQuestion(
  config: InterviewConfig,
  bank: BankQuestion[],
  resumeText?: string | null,
) {
  return chatJSON<FirstTurn>([
    { role: "system", content: personaPrompt(config, resumeText) + questionBankHint(bank) },
    { role: "user", content: FIRST_QUESTION_INSTRUCTION },
  ]);
}

export async function generateNextTurn(
  config: InterviewConfig,
  bank: BankQuestion[],
  transcript: TranscriptEntry[],
  resumeText: string | null | undefined,
  askedCount: number,
) {
  const budget = questionBudget(config.duration_minutes);
  const messages: ChatMessage[] = [
    { role: "system", content: personaPrompt(config, resumeText) + questionBankHint(bank) },
    ...transcript.map<ChatMessage>((m) => ({
      role: m.sender === "ai" ? "assistant" : "user",
      content: m.message_text,
    })),
    {
      role: "user",
      content: `[SYSTEM] Questions asked so far: ${askedCount} of a budget of ${budget}. ${TURN_INSTRUCTION}`,
    },
  ];
  const turn = await chatJSON<Turn>(messages);
  if (askedCount >= budget) turn.shouldEnd = true;
  return turn;
}

export async function generateFinalReport(
  config: InterviewConfig,
  transcript: TranscriptEntry[],
): Promise<FinalReport> {
  const dialogue = transcript
    .map((m) => `${m.sender === "ai" ? "INTERVIEWER" : "CANDIDATE"}: ${m.message_text}`)
    .join("\n\n");

  const report = await chatJSON<FinalReport>([
    { role: "system", content: personaPrompt(config) },
    { role: "user", content: `TRANSCRIPT:\n\n${dialogue}\n\n${FINAL_EVALUATION_INSTRUCTION}` },
  ]);

  return {
    overallScore: clamp(report.overallScore),
    categoryScores: Object.fromEntries(
      Object.entries(report.categoryScores ?? {}).map(([k, v]) => [k, clamp(Number(v))]),
    ),
    strengths: report.strengths ?? [],
    areasToImprove: report.areasToImprove ?? [],
    recommendedTopics: report.recommendedTopics ?? [],
    aiFeedbackSummary: report.aiFeedbackSummary ?? "",
  };
}

function clamp(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}
