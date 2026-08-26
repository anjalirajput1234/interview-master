import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bot, User } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { getInterview } from "@/lib/interview.functions";

export const Route = createFileRoute("/interview/$id/transcript")({
  head: () => ({
    meta: [
      { title: "Interview transcript — InterviewAI" },
      {
        name: "description",
        content: "Replay the full question-and-answer transcript of your mock interview with timestamps.",
      },
      { property: "og:title", content: "Interview transcript" },
      { property: "og:description", content: "Every question and answer, with timestamps." },
    ],
  }),
  component: TranscriptPage,
});

function TranscriptPage() {
  const { id } = Route.useParams();
  const fn = useServerFn(getInterview);
  const { data, isLoading } = useQuery({
    queryKey: ["interview", id, "transcript"],
    queryFn: () => fn({ data: { id } }),
  });

  return (
    <AppShell
      title="Transcript"
      subtitle={data ? `${data.interview.role} · ${data.interview.interview_type}` : undefined}
    >
      <div className="mb-4 flex gap-3">
        <Button asChild variant="outline" size="sm">
          <Link to="/history">Back to history</Link>
        </Button>
        <Button asChild size="sm">
          <Link to="/interview/$id/result" params={{ id }}>
            View report
          </Link>
        </Button>
      </div>

      <div className="glass space-y-4 rounded-3xl p-6">
        {isLoading && <p className="text-sm text-muted-foreground">Loading transcript…</p>}
        {(data?.messages ?? []).map((m) => {
          const ai = m.sender === "ai";
          return (
            <div key={m.id} className="flex gap-3">
              <div
                className={`mt-1 flex size-8 shrink-0 items-center justify-center rounded-full ${
                  ai ? "gradient-primary text-primary-foreground" : "bg-secondary"
                }`}
              >
                {ai ? <Bot className="size-4" /> : <User className="size-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">
                  {ai ? "Interviewer" : "You"} ·{" "}
                  {new Date(m.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{m.message_text}</p>
              </div>
            </div>
          );
        })}
        {!isLoading && (data?.messages ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">No transcript recorded for this session.</p>
        )}
      </div>
    </AppShell>
  );
}
