import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createInterview } from "@/lib/interview.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/practice")({
  head: () => ({
    meta: [
      { title: "Practice mode — InterviewAI" },
      {
        name: "description",
        content: "Drill a single topic with instant hints and feedback after every answer.",
      },
      { property: "og:title", content: "Practice mode" },
      { property: "og:description", content: "Topic-focused drills with instant AI feedback." },
    ],
  }),
  component: PracticePage,
});

const TOPICS = [
  "JavaScript fundamentals",
  "React & hooks",
  "Node.js & Express",
  "MongoDB & data modelling",
  "System design basics",
  "Behavioural / HR",
];

function PracticePage() {
  const navigate = useNavigate();
  const create = useServerFn(createInterview);
  const [topic, setTopic] = useState(TOPICS[0]!);
  const [role, setRole] = useState("Full Stack Developer");

  const mutation = useMutation({
    mutationFn: () =>
      create({
        data: {
          role,
          interview_type: "technical" as const,
          experience_level: "fresher" as const,
          difficulty_mode: "adaptive" as const,
          duration_minutes: 10,
          mode: "practice" as const,
          topic,
          avatar_persona: "aria",
        },
      }),
    onSuccess: ({ id }) => navigate({ to: "/interview/$id", params: { id } }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not start practice"),
  });

  return (
    <AppShell
      title="Practice mode"
      subtitle="Same interviewer, lower stakes — you get a hint and feedback after every answer."
    >
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="glass rounded-3xl p-6">
          <h2 className="text-base font-medium">Pick a topic</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {TOPICS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTopic(t)}
                className={cn(
                  "rounded-2xl border p-4 text-left text-sm transition-all",
                  topic === t
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card/50 hover:border-primary/50",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        <section className="glass h-fit rounded-3xl p-6">
          <Label htmlFor="practice-role">Target role</Label>
          <Input
            id="practice-role"
            className="mt-2"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
          <Button
            className="mt-6 w-full"
            size="lg"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Starting…" : "Start practice"}
            <ArrowRight className="ml-1 size-4" />
          </Button>
        </section>
      </div>
    </AppShell>
  );
}
