import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { ArrowRight, Check } from "lucide-react";
import { AppShell, useMe } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PERSONAS } from "@/lib/personas";
import { createInterview } from "@/lib/interview.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/interview/new")({
  head: () => ({
    meta: [
      { title: "Configure your interview — InterviewAI" },
      {
        name: "description",
        content: "Choose role, interview type, difficulty, duration and your AI interviewer.",
      },
      { property: "og:title", content: "Configure your AI mock interview" },
      { property: "og:description", content: "Role, type, difficulty and interviewer persona." },
    ],
  }),
  component: NewInterview,
});

const TYPES = [
  { id: "technical", label: "Technical", d: "DSA, stack depth, system thinking" },
  { id: "hr", label: "HR", d: "Motivation, culture, communication" },
  { id: "mixed", label: "Mixed", d: "Technical + behavioural blend" },
  { id: "project", label: "Project deep-dive", d: "Grilled on what you built" },
] as const;

const LEVELS = [
  { id: "fresher", label: "Fresher" },
  { id: "0-1", label: "0–1 years" },
  { id: "1-3", label: "1–3 years" },
  { id: "3-5", label: "3–5 years" },
] as const;

const DIFFICULTIES = [
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
  { id: "adaptive", label: "Adaptive" },
] as const;

const DURATIONS = [10, 15, 20, 30] as const;

function OptionCard({
  active,
  onClick,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border p-4 text-left transition-all",
        active
          ? "border-primary bg-primary/10 shadow-[0_0_0_1px_var(--primary)]"
          : "border-border bg-card/50 hover:border-primary/50",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{title}</span>
        {active && <Check className="size-4 text-primary" />}
      </div>
      {desc && <p className="mt-1 text-xs text-muted-foreground">{desc}</p>}
    </button>
  );
}

function NewInterview() {
  const navigate = useNavigate();
  const me = useMe();
  const create = useServerFn(createInterview);

  const [role, setRole] = useState("Full Stack Developer");
  const [type, setType] = useState<(typeof TYPES)[number]["id"]>("technical");
  const [level, setLevel] = useState<(typeof LEVELS)[number]["id"]>("fresher");
  const [difficulty, setDifficulty] =
    useState<(typeof DIFFICULTIES)[number]["id"]>("adaptive");
  const [duration, setDuration] = useState<number>(15);
  const [persona, setPersona] = useState(me.data?.profile?.preferred_avatar_persona ?? "aria");

  const mutation = useMutation({
    mutationFn: () =>
      create({
        data: {
          role,
          interview_type: type,
          experience_level: level,
          difficulty_mode: difficulty,
          duration_minutes: duration,
          mode: "interview" as const,
          avatar_persona: persona,
        },
      }),
    onSuccess: ({ id }) => navigate({ to: "/interview/$id", params: { id } }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not start the interview"),
  });

  return (
    <AppShell
      title="Set up your interview"
      subtitle="Everything here shapes how your AI interviewer behaves."
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-6 lg:grid-cols-[1.4fr_1fr]"
      >
        <div className="space-y-8">
          <section className="glass rounded-3xl p-6">
            <Label htmlFor="role" className="text-base">
              Target role
            </Label>
            <p className="mb-3 mt-1 text-sm text-muted-foreground">
              e.g. Frontend Developer, MERN Stack Developer, Data Analyst.
            </p>
            <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} />
          </section>

          <section className="glass rounded-3xl p-6">
            <h2 className="text-base font-medium">Interview type</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {TYPES.map((t) => (
                <OptionCard
                  key={t.id}
                  active={type === t.id}
                  onClick={() => setType(t.id)}
                  title={t.label}
                  desc={t.d}
                />
              ))}
            </div>
          </section>

          <section className="glass rounded-3xl p-6">
            <h2 className="text-base font-medium">Experience level</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {LEVELS.map((l) => (
                <OptionCard
                  key={l.id}
                  active={level === l.id}
                  onClick={() => setLevel(l.id)}
                  title={l.label}
                />
              ))}
            </div>
          </section>

          <section className="glass rounded-3xl p-6">
            <h2 className="text-base font-medium">Difficulty</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {DIFFICULTIES.map((d) => (
                <OptionCard
                  key={d.id}
                  active={difficulty === d.id}
                  onClick={() => setDifficulty(d.id)}
                  title={d.label}
                />
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Adaptive raises or lowers difficulty based on how well you answer.
            </p>
          </section>

          <section className="glass rounded-3xl p-6">
            <h2 className="text-base font-medium">Duration</h2>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {DURATIONS.map((d) => (
                <OptionCard
                  key={d}
                  active={duration === d}
                  onClick={() => setDuration(d)}
                  title={`${d} min`}
                />
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="glass rounded-3xl p-6">
            <h2 className="text-base font-medium">Your AI interviewer</h2>
            <div className="mt-4 space-y-3">
              {PERSONAS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPersona(p.id)}
                  className={cn(
                    "flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-all",
                    persona === p.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card/50 hover:border-primary/50",
                  )}
                >
                  <span
                    className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full font-display text-lg font-semibold"
                    style={{ background: p.accent, color: "oklch(0.16 0.028 265)" }}
                  >
                    {p.name[0]}
                  </span>
                  <span>
                    <span className="flex items-center gap-2 font-medium">
                      {p.name}
                      <span className="text-xs font-normal text-muted-foreground">{p.title}</span>
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">{p.blurb}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <div className="glass sticky top-24 rounded-3xl p-6">
            <p className="text-sm text-muted-foreground">
              {role || "Your role"} · {type} · {duration} min · {difficulty}
            </p>
            <Button
              size="lg"
              className="mt-4 w-full"
              disabled={mutation.isPending || role.trim().length < 2}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? "Preparing your interviewer…" : "Continue to camera check"}
              <ArrowRight className="ml-1 size-4" />
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              You'll test your camera and mic before the interview starts.
            </p>
          </div>
        </div>
      </motion.div>
    </AppShell>
  );
}
