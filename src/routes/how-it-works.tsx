import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Aurora, Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — InterviewAI" },
      {
        name: "description",
        content:
          "Four steps: set up your interview, pick an interviewer, answer out loud, and get a scored report.",
      },
      { property: "og:title", content: "How InterviewAI works" },
      { property: "og:description", content: "From setup to scored report in under 20 minutes." },
    ],
  }),
  component: HowItWorks,
});

const STEPS = [
  {
    title: "Set up your interview",
    body: "Choose your target role, experience level, interview type, difficulty and duration. Paste your resume for questions grounded in your real projects.",
  },
  {
    title: "Pick your interviewer",
    body: "Choose an avatar persona and language, then run the camera and mic check on the pre-join screen — exactly like joining a real video call.",
  },
  {
    title: "Answer out loud",
    body: "The AI interviewer speaks each question and listens as you answer. It follows up when something is vague and moves on when you nail it.",
  },
  {
    title: "Get your report",
    body: "Category scores, strengths, gaps, filler-word feedback and topics to revise — on screen and as a downloadable PDF.",
  },
];

function HowItWorks() {
  return (
    <div className="min-h-screen">
      <Aurora />
      <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4">
        <Logo />
        <Button asChild size="sm">
          <Link to="/auth" search={{ mode: "signup" }}>
            Get started
          </Link>
        </Button>
      </header>
      <main className="mx-auto max-w-4xl px-4 pb-24">
        <h1 className="font-display text-4xl font-semibold md:text-5xl">How it works</h1>
        <p className="mt-4 text-muted-foreground">
          From setup to a scored report in under twenty minutes.
        </p>
        <ol className="mt-12 space-y-5">
          {STEPS.map((s, i) => (
            <motion.li
              key={s.title}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass flex gap-5 rounded-3xl p-6"
            >
              <span className="gradient-primary flex size-10 shrink-0 items-center justify-center rounded-xl font-display text-lg font-semibold text-primary-foreground">
                {i + 1}
              </span>
              <div>
                <h2 className="font-medium">{s.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </div>
            </motion.li>
          ))}
        </ol>
        <div className="mt-12 flex justify-center">
          <Button asChild size="lg">
            <Link to="/auth" search={{ mode: "signup" }}>
              Run your first interview
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
