import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  answerTurn,
  completeAndScore,
  loadTranscript,
  requireInterview,
  startInterview,
} from "./interview.server";
import { questionBudget } from "./ai/interviewer.server";

export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("id,name,email,resume_text,preferred_avatar_persona")
      .eq("id", context.userId)
      .maybeSingle();
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    return {
      profile,
      isAdmin: (roles ?? []).some((r: { role: string }) => r.role === "admin"),
    };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        name: z.string().max(120).optional(),
        resume_text: z.string().max(20000).nullable().optional(),
        preferred_avatar_persona: z.string().max(40).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update(data)
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createInterview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        role: z.string().min(2).max(80),
        experience_level: z.enum(["fresher", "0-1", "1-3", "3-5"]),
        interview_type: z.enum(["technical", "hr", "mixed", "project"]),
        difficulty_mode: z.enum(["easy", "medium", "hard", "adaptive"]),
        duration_minutes: z.number().int().min(5).max(60),
        mode: z.enum(["interview", "practice"]).default("interview"),
        topic: z.string().max(80).nullable().optional(),
        avatar_persona: z.string().max(40).default("aria"),
        avatar_id: z.string().uuid().nullable().optional(),
        language: z.enum(["en", "hinglish"]).default("en"),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const interview = await startInterview(context.supabase, context.userId, data);
    return { id: interview.id };
  });

/** Feature 1: selectable AI interviewer avatars for the pre-join screen. */
export const listAvatars = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("avatars")
      .select("id,name,short_description,thumbnail_url,voice_style,accent_color,sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getInterview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const interview = await requireInterview(context.supabase, data.id);
    const messages = await loadTranscript(context.supabase, data.id);
    return {
      interview,
      messages,
      budget: questionBudget(interview.duration_minutes),
    };
  });

export const sendAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), text: z.string().min(1).max(6000) }).parse(data),
  )
  .handler(async ({ data, context }) =>
    answerTurn(context.supabase, context.userId, data.id, data.text.trim()),
  );

export const completeInterview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) =>
    completeAndScore(context.supabase, context.userId, data.id),
  );

export const listInterviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: interviews } = await context.supabase
      .from("interviews")
      .select("id,role,interview_type,difficulty_mode,status,started_at,duration_minutes,mode")
      .order("started_at", { ascending: false })
      .limit(100);
    const { data: results } = await context.supabase
      .from("interview_results")
      .select("interview_id,overall_score,created_at");
    return { interviews: interviews ?? [], results: results ?? [] };
  });

export const getResult = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const interview = await requireInterview(context.supabase, data.id);
    const { data: result } = await context.supabase
      .from("interview_results")
      .select("*")
      .eq("interview_id", data.id)
      .maybeSingle();
    return { interview, result };
  });

export const listQuestions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("questions")
      .select("*")
      .order("created_at", { ascending: false });
    return data ?? [];
  });

export const saveQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid().nullable().optional(),
        text: z.string().min(5).max(1000),
        category: z.string().min(1).max(60),
        difficulty: z.enum(["easy", "medium", "hard"]),
        interview_type: z.enum(["technical", "hr", "mixed", "project"]),
        expected_concepts: z.array(z.string()).default([]),
        evaluation_criteria: z.array(z.string()).default([]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { id, ...fields } = data;
    if (id) {
      const { error } = await context.supabase.from("questions").update(fields).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: row, error } = await context.supabase
      .from("questions")
      .insert({ ...fields, created_by: context.userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

export const deleteQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("questions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
