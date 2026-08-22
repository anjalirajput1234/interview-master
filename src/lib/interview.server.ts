import type { SupabaseClient } from "@supabase/supabase-js";
import {
  generateFinalReport,
  generateFirstQuestion,
  generateNextTurn,
  questionBudget,
  type BankQuestion,
} from "./ai/interviewer.server";
import type { InterviewConfig } from "./ai/promptTemplates.server";

/* eslint-disable @typescript-eslint/no-explicit-any */
type DB = SupabaseClient<any, any, any>;

export type InterviewRow = InterviewConfig & {
  id: string;
  user_id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
};

export async function loadBank(db: DB, interviewType: string): Promise<BankQuestion[]> {
  const { data } = await db
    .from("questions")
    .select("text,category,difficulty,expected_concepts")
    .in("interview_type", interviewType === "mixed" ? ["technical", "hr", "mixed"] : [interviewType])
    .limit(20);
  return (data ?? []) as BankQuestion[];
}

export async function getResumeText(db: DB, userId: string) {
  const { data } = await db.from("profiles").select("resume_text").eq("id", userId).maybeSingle();
  return (data?.resume_text as string | null) ?? null;
}

export async function requireInterview(db: DB, id: string): Promise<InterviewRow> {
  const { data, error } = await db.from("interviews").select("*").eq("id", id).maybeSingle();
  if (error || !data) throw new Error("Interview not found");
  return data as InterviewRow;
}

export async function loadTranscript(db: DB, interviewId: string) {
  const { data } = await db
    .from("interview_messages")
    .select("id,sender,message_text,question_category,created_at")
    .eq("interview_id", interviewId)
    .order("created_at", { ascending: true });
  return (data ?? []) as {
    id: string;
    sender: string;
    message_text: string;
    question_category: string | null;
    created_at: string;
  }[];
}

export async function startInterview(db: DB, userId: string, config: Record<string, unknown>) {
  const { data, error } = await db
    .from("interviews")
    .insert({ ...config, user_id: userId })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  const interview = data as InterviewRow;

  const [bank, resume] = await Promise.all([
    loadBank(db, interview.interview_type),
    getResumeText(db, userId),
  ]);

  const first = await generateFirstQuestion(interview, bank, resume);
  await db.from("interview_messages").insert({
    interview_id: interview.id,
    user_id: userId,
    sender: "ai",
    message_text: first.reply,
    question_category: first.nextCategory ?? null,
    difficulty_at_time: first.nextDifficulty ?? null,
  });

  return interview;
}

export async function answerTurn(db: DB, userId: string, interviewId: string, text: string) {
  const interview = await requireInterview(db, interviewId);
  if (interview.status !== "in_progress") throw new Error("This interview is already finished.");

  const transcript = await loadTranscript(db, interviewId);

  // Abuse protection: cap messages and throttle rapid-fire submissions.
  if (transcript.length > 80) throw new Error("Message limit reached for this interview.");
  const last = transcript[transcript.length - 1];
  if (last && last.sender === "candidate") throw new Error("Please wait for the interviewer to respond.");
  if (last && Date.now() - new Date(last.created_at).getTime() < 1200) {
    throw new Error("You're sending answers too quickly. Please slow down.");
  }

  await db.from("interview_messages").insert({
    interview_id: interviewId,
    user_id: userId,
    sender: "candidate",
    message_text: text,
  });

  const askedCount = transcript.filter((m) => m.sender === "ai").length;
  const [bank, resume] = await Promise.all([
    loadBank(db, interview.interview_type),
    getResumeText(db, userId),
  ]);

  const turn = await generateNextTurn(
    interview,
    bank,
    [...transcript, { sender: "candidate", message_text: text }],
    resume,
    askedCount,
  );

  await db.from("interview_messages").insert({
    interview_id: interviewId,
    user_id: userId,
    sender: "ai",
    message_text: turn.reply,
    question_category: turn.nextCategory ?? null,
    difficulty_at_time: turn.nextDifficulty ?? null,
  });

  return {
    reply: turn.reply,
    category: turn.nextCategory ?? null,
    shouldEnd: Boolean(turn.shouldEnd),
    asked: askedCount + 1,
    budget: questionBudget(interview.duration_minutes),
  };
}

export async function completeAndScore(db: DB, userId: string, interviewId: string) {
  const interview = await requireInterview(db, interviewId);
  const existing = await db
    .from("interview_results")
    .select("interview_id")
    .eq("interview_id", interviewId)
    .maybeSingle();
  if (existing.data) {
    await db
      .from("interviews")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", interviewId);
    return { interviewId };
  }

  const transcript = await loadTranscript(db, interviewId);
  const report = await generateFinalReport(interview, transcript);

  const { error } = await db.from("interview_results").insert({
    interview_id: interviewId,
    user_id: userId,
    overall_score: report.overallScore,
    category_scores: report.categoryScores,
    strengths: report.strengths,
    areas_to_improve: report.areasToImprove,
    recommended_topics: report.recommendedTopics,
    ai_feedback_summary: report.aiFeedbackSummary,
  });
  if (error) throw new Error(error.message);

  await db
    .from("interviews")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", interviewId);

  return { interviewId };
}
