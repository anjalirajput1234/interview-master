import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell, useMe } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/lib/interview.functions";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — InterviewAI" },
      {
        name: "description",
        content: "Update your name and paste your resume so questions match your real experience.",
      },
      { property: "og:title", content: "Your InterviewAI profile" },
      { property: "og:description", content: "Resume-aware interviews start here." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const me = useMe();
  const qc = useQueryClient();
  const save = useServerFn(updateProfile);
  const [name, setName] = useState("");
  const [resume, setResume] = useState("");

  useEffect(() => {
    if (me.data?.profile) {
      setName(me.data.profile.name ?? "");
      setResume(me.data.profile.resume_text ?? "");
    }
  }, [me.data]);

  const mutation = useMutation({
    mutationFn: () => save({ data: { name, resume_text: resume || null } }),
    onSuccess: () => {
      toast.success("Profile saved");
      void qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
  });

  return (
    <AppShell title="Profile" subtitle="Your resume makes every interview sharper.">
      <div className="glass max-w-3xl space-y-6 rounded-3xl p-6">
        <div className="space-y-2">
          <Label htmlFor="profile-name">Full name</Label>
          <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="resume">Resume text</Label>
          <p className="text-xs text-muted-foreground">
            Paste your resume — the interviewer will ask about the projects and stack you list.
          </p>
          <Textarea
            id="resume"
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            className="min-h-64"
            maxLength={20000}
            placeholder="Experience, projects, skills…"
          />
        </div>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </AppShell>
  );
}
