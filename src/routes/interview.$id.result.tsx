import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "motion/react";
import { CheckCircle2, Lightbulb, TriangleAlert } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ScoreRing } from "@/components/score-ring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getResult } from "@/lib/interview.functions";

export const Route = createFileRoute("/interview/$id/result")({
  head: () => ({
    meta: [
      { title: "Interview report — InterviewAI" },
      {
        name: "description",
        content: "Your scored interview report: category scores, strengths, gaps and topics to practice.",
      },
      { property: "og:title", content: "Your AI interview report" },
      { property: "og:description", content: "Category scores, strengths and areas to improve." },
    ],
  }),
  component: ResultPage,
});

function ResultPage() {
  const { id } = Route.useParams();
  const fn = useServerFn(getResult);
  const { data, isLoading } = useQuery({
    queryKey: ["result", id],
    queryFn: () => fn({ data: { id } }),
    refetchInterval: (q) => (q.state.data?.result ? false : 4000),
  });

  const result = data?.result as
    | {
        overall_score: number;
        category_scores: Record<string, number> | null;
        strengths: string[] | null;
        areas_to_improve: string[] | null;
        recommended_topics: string[] | null;
        ai_feedback_summary: string | null;
      }
    | null
    | undefined;

  return (
    <AppShell
      title="Interview report"
      subtitle={data ? `${data.interview.role} · ${data.interview.interview_type}` : undefined}
    >
      {isLoading || !result ? (
        <div className="glass flex min-h-64 flex-col items-center justify-center gap-4 rounded-3xl p-10 text-center">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            Scoring your answers and writing your feedback…
          </p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="glass grid gap-8 rounded-3xl p-8 md:grid-cols-[auto_1fr] md:items-center">
            <ScoreRing score={Number(result.overall_score) || 0} />
            <div>
              <h2 className="font-display text-xl font-semibold">Overall performance</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {result.ai_feedback_summary || "No summary available for this session."}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild>
                  <Link to="/interview/new">Run another interview</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/history">View all sessions</Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="glass rounded-3xl p-6">
            <h2 className="font-display text-lg font-semibold">Category scores</h2>
            <div className="mt-5 space-y-4">
              {Object.entries(result.category_scores ?? {}).map(([label, value]) => (
                <div key={label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize">{label.replace(/_/g, " ")}</span>
                    <span className="text-muted-foreground">{Math.round(Number(value))}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                    <motion.div
                      className="gradient-primary h-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Number(value))}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>
              ))}
              {!result.category_scores && (
                <p className="text-sm text-muted-foreground">No category breakdown available.</p>
              )}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <ListCard
              title="Strengths"
              icon={CheckCircle2}
              tone="text-success"
              items={result.strengths ?? []}
            />
            <ListCard
              title="Areas to improve"
              icon={TriangleAlert}
              tone="text-warning"
              items={result.areas_to_improve ?? []}
            />
            <div className="glass rounded-3xl p-6">
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
                <Lightbulb className="size-5 text-primary" /> Practice next
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {(result.recommended_topics ?? []).map((t) => (
                  <Badge key={t} variant="outline">
                    {t}
                  </Badge>
                ))}
                {(result.recommended_topics ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">Nothing flagged — nice work.</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AppShell>
  );
}

function ListCard({
  title,
  items,
  icon: Icon,
  tone,
}: {
  title: string;
  items: string[];
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}) {
  return (
    <div className="glass rounded-3xl p-6">
      <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
        <Icon className={`size-5 ${tone}`} /> {title}
      </h3>
      <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
            {item}
          </li>
        ))}
        {items.length === 0 && <li>No notes for this session.</li>}
      </ul>
    </div>
  );
}
