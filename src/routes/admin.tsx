import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { AppShell, useMe } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { deleteQuestion, listQuestions, saveQuestion } from "@/lib/interview.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Question bank — InterviewAI" },
      {
        name: "description",
        content: "Admin tools for curating the InterviewAI question bank by type and difficulty.",
      },
      { property: "og:title", content: "InterviewAI question bank" },
      { property: "og:description", content: "Curate the questions your AI interviewer draws from." },
    ],
  }),
  component: AdminPage,
});

type Difficulty = "easy" | "medium" | "hard";
type InterviewType = "technical" | "hr" | "mixed" | "project";

function AdminPage() {
  const me = useMe();
  const qc = useQueryClient();
  const list = useServerFn(listQuestions);
  const save = useServerFn(saveQuestion);
  const remove = useServerFn(deleteQuestion);

  const [text, setText] = useState("");
  const [category, setCategory] = useState("JavaScript");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [interviewType, setInterviewType] = useState<InterviewType>("technical");
  const [concepts, setConcepts] = useState("");

  const questions = useQuery({
    queryKey: ["questions"],
    queryFn: () => list(),
    enabled: Boolean(me.data?.isAdmin),
  });

  const create = useMutation({
    mutationFn: () =>
      save({
        data: {
          text,
          category,
          difficulty,
          interview_type: interviewType,
          expected_concepts: concepts
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean),
          evaluation_criteria: [],
        },
      }),
    onSuccess: () => {
      toast.success("Question added");
      setText("");
      setConcepts("");
      void qc.invalidateQueries({ queryKey: ["questions"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
  });

  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["questions"] }),
  });

  if (me.isSuccess && !me.data.isAdmin) {
    return (
      <AppShell title="Question bank">
        <div className="glass rounded-3xl p-10 text-center text-sm text-muted-foreground">
          You need an admin role to manage the question bank.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Question bank" subtitle="Curate what your AI interviewer draws from.">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <section className="glass h-fit space-y-4 rounded-3xl p-6">
          <div className="space-y-2">
            <Label htmlFor="q-text">Question</Label>
            <Textarea id="q-text" value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="q-cat">Category</Label>
              <Input id="q-cat" value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["easy", "medium", "hard"] as const).map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Interview type</Label>
            <Select
              value={interviewType}
              onValueChange={(v) => setInterviewType(v as InterviewType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["technical", "hr", "mixed", "project"] as const).map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="q-concepts">Expected concepts (comma separated)</Label>
            <Input
              id="q-concepts"
              value={concepts}
              onChange={(e) => setConcepts(e.target.value)}
              placeholder="closures, scope, hoisting"
            />
          </div>
          <Button
            className="w-full"
            disabled={create.isPending || text.trim().length < 5}
            onClick={() => create.mutate()}
          >
            {create.isPending ? "Saving…" : "Add question"}
          </Button>
        </section>

        <section className="glass overflow-hidden rounded-3xl">
          {(questions.data ?? []).map((q) => (
            <div
              key={q.id as string}
              className="flex items-start justify-between gap-4 border-b border-border/60 p-4 last:border-0"
            >
              <div>
                <p className="text-sm">{q.text as string}</p>
                <div className="mt-2 flex gap-2">
                  <Badge variant="outline">{q.interview_type as string}</Badge>
                  <Badge variant="outline">{q.category as string}</Badge>
                  <Badge variant="outline">{q.difficulty as string}</Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete question"
                onClick={() => del.mutate(q.id as string)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          {(questions.data ?? []).length === 0 && (
            <p className="p-10 text-center text-sm text-muted-foreground">No questions yet.</p>
          )}
        </section>
      </div>
    </AppShell>
  );
}
