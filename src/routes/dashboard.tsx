import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "motion/react";
import { ArrowRight, GraduationCap, History, Trophy, Video } from "lucide-react";
import { AppShell, useMe } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listInterviews } from "@/lib/interview.functions";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — InterviewAI" },
      { name: "description", content: "Your interview progress, recent sessions and average score." },
      { property: "og:title", content: "Your InterviewAI dashboard" },
      { property: "og:description", content: "Track scores and jump into your next mock interview." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const me = useMe();
  const fn = useServerFn(listInterviews);
  const { data } = useQuery({ queryKey: ["interviews"], queryFn: () => fn() });

  const interviews = data?.interviews ?? [];
  const results = data?.results ?? [];
  const scores = results.map((r) => Number(r.overall_score) || 0);
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const best = scores.length ? Math.max(...scores) : 0;
  const scoreByInterview = new Map(results.map((r) => [r.interview_id, Number(r.overall_score)]));

  const stats = [
    { label: "Interviews taken", value: interviews.length, icon: Video },
    { label: "Average score", value: avg ? `${avg}%` : "—", icon: GraduationCap },
    { label: "Best score", value: best ? `${best}%` : "—", icon: Trophy },
    { label: "Reports ready", value: results.length, icon: History },
  ];

  const firstName = (me.data?.profile?.name || "").split(" ")[0];

  return (
    <AppShell
      title={firstName ? `Welcome back, ${firstName}` : "Welcome back"}
      subtitle="Ready for another round? Your AI interviewer is standing by."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-2xl p-5"
          >
            <s.icon className="size-5 text-primary" />
            <p className="mt-4 font-display text-3xl font-semibold">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="glass glow rounded-3xl p-8">
          <h2 className="font-display text-2xl font-semibold">Start a new interview</h2>
          <p className="mt-2 max-w-md text-muted-foreground">
            Pick a role, choose your AI interviewer, and join a live video round with adaptive
            follow-up questions.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/interview/new">
                Start interview <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/practice">Practice a single topic</Link>
            </Button>
          </div>
        </div>

        <div className="glass rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent sessions</h2>
            <Link to="/history" className="text-sm text-muted-foreground hover:text-foreground">
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {interviews.slice(0, 5).map((iv) => (
              <Link
                key={iv.id}
                to="/interview/$id/result"
                params={{ id: iv.id }}
                className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-3 transition-colors hover:bg-secondary/60"
              >
                <div>
                  <p className="text-sm font-medium">{iv.role}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(iv.started_at).toLocaleDateString()} · {iv.interview_type}
                  </p>
                </div>
                {scoreByInterview.has(iv.id) ? (
                  <Badge>{Math.round(scoreByInterview.get(iv.id)!)}%</Badge>
                ) : (
                  <Badge variant="outline">{iv.status.replace("_", " ")}</Badge>
                )}
              </Link>
            ))}
            {interviews.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No interviews yet — your first one takes about 10 minutes.
              </p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
