import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "motion/react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listInterviews } from "@/lib/interview.functions";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Interview history — InterviewAI" },
      {
        name: "description",
        content: "Every mock interview you've taken, with scores and a progress trend over time.",
      },
      { property: "og:title", content: "Your interview history" },
      { property: "og:description", content: "Scores, dates and transcripts for every session." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const fn = useServerFn(listInterviews);
  const { data } = useQuery({ queryKey: ["interviews"], queryFn: () => fn() });

  const interviews = data?.interviews ?? [];
  const scores = new Map(
    (data?.results ?? []).map((r) => [r.interview_id, Number(r.overall_score)]),
  );

  const trend = [...interviews]
    .filter((iv) => scores.has(iv.id))
    .sort((a, b) => +new Date(a.started_at) - +new Date(b.started_at))
    .map((iv) => ({
      date: new Date(iv.started_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      score: Math.round(scores.get(iv.id)!),
    }));

  return (
    <AppShell title="Your history" subtitle="Every session, scored and searchable.">
      {trend.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass mb-6 rounded-3xl p-6"
        >
          <h2 className="font-display text-lg font-semibold">Score over time</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ left: -20, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" />
                <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--popover-foreground)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="var(--primary)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "var(--primary)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      <div className="glass overflow-hidden rounded-3xl">
        {interviews.map((iv) => (
          <div
            key={iv.id}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 p-4 last:border-0"
          >
            <div>
              <p className="font-medium">{iv.role}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(iv.started_at).toLocaleString()} · {iv.interview_type} ·{" "}
                {iv.duration_minutes} min
              </p>
            </div>
            <div className="flex items-center gap-3">
              {scores.has(iv.id) ? (
                <Badge>{Math.round(scores.get(iv.id)!)}%</Badge>
              ) : (
                <Badge variant="outline">{iv.status.replace("_", " ")}</Badge>
              )}
              <Button asChild size="sm" variant="outline">
                <Link to="/interview/$id/transcript" params={{ id: iv.id }}>
                  Transcript
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/interview/$id/result" params={{ id: iv.id }}>
                  Report
                </Link>
              </Button>
            </div>
          </div>
        ))}
        {interviews.length === 0 && (
          <p className="p-10 text-center text-sm text-muted-foreground">
            No interviews yet. Start one from your dashboard.
          </p>
        )}
      </div>
    </AppShell>
  );
}
