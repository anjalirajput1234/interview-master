import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ArrowRight,
  Brain,
  FileText,
  LineChart,
  Mic,
  Video,
  Gauge,
  Sparkles,
} from "lucide-react";
import { Aurora, Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "InterviewAI — Practice Interviews. Get Better. Get Hired." },
      {
        name: "description",
        content:
          "Join a live video mock interview with an AI interviewer that asks adaptive follow-ups and scores your performance.",
      },
      { property: "og:title", content: "InterviewAI — AI Video Mock Interviews" },
      {
        property: "og:description",
        content:
          "A talking AI interviewer, adaptive follow-up questions and a detailed scored report after every session.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Video,
    title: "Real video-call interviews",
    body: "Your camera on one side, a talking AI interviewer on the other. It speaks every question out loud.",
  },
  {
    icon: Brain,
    title: "Adaptive follow-ups",
    body: "Say “I used JWT” and it asks where you stored the token — and why. Never a static question tree.",
  },
  {
    icon: Gauge,
    title: "Real-time difficulty",
    body: "Strong answers escalate the difficulty. Weak ones hold or step down, just like a real interviewer.",
  },
  {
    icon: FileText,
    title: "Resume-aware questions",
    body: "Upload your resume and get grilled on the projects and stack you actually claim.",
  },
  {
    icon: Mic,
    title: "Speak or type",
    body: "Answer with your mic like a real call, or type it. Live captions for both sides.",
  },
  {
    icon: LineChart,
    title: "Scored progress",
    body: "Category-wise scores, strengths, gaps, and a progress graph across every session.",
  },
];

const STEPS = [
  { n: "01", t: "Configure", d: "Pick role, interview type, experience, difficulty and duration." },
  { n: "02", t: "Camera check", d: "Test your camera and mic, then choose your AI interviewer." },
  { n: "03", t: "Interview", d: "The AI asks, listens, probes deeper and adapts in real time." },
  { n: "04", t: "Report", d: "Get scores, narrative feedback and topics to practice next." },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <Aurora />
      <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4">
        <Logo />
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/features"
            className="hidden rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground sm:block"
          >
            Features
          </Link>
          <Link
            to="/how-it-works"
            className="hidden rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground sm:block"
          >
            How it works
          </Link>
          <Button asChild variant="ghost">
            <Link to="/auth">Log in</Link>
          </Button>
          <Button asChild>
            <Link to="/auth" search={{ mode: "signup" }}>
              Get started
            </Link>
          </Button>
        </nav>
      </header>

      <section className="mx-auto max-w-7xl px-4 pb-24 pt-12 text-center sm:pt-20">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="size-3.5 text-primary" />
            Live AI video interviewer
          </span>
          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-semibold leading-tight sm:text-6xl">
            Practice interviews. <span className="text-gradient">Get better.</span> Get hired.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            InterviewAI runs a realistic mock interview on video — a talking AI interviewer asks,
            listens, probes deeper on your actual answers, then hands you a scored performance
            report.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="glow">
              <Link to="/auth" search={{ mode: "signup" }}>
                Start mock interview <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/how-it-works">How it works</Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass mx-auto mt-16 grid max-w-5xl gap-4 rounded-3xl p-4 sm:grid-cols-[1.4fr_1fr]"
        >
          <div className="relative flex aspect-video items-center justify-center rounded-2xl bg-gradient-to-br from-primary/25 to-primary/5">
            <div className="gradient-primary flex size-24 items-center justify-center rounded-full">
              <Video className="size-9 text-primary-foreground" />
            </div>
            <span className="absolute bottom-3 left-3 rounded-full bg-background/70 px-3 py-1 text-xs backdrop-blur">
              Aria · Engineering Manager
            </span>
          </div>
          <div className="grid gap-4">
            <div className="flex aspect-video items-center justify-center rounded-2xl border border-border bg-secondary/40 text-xs text-muted-foreground">
              Your camera
            </div>
            <div className="rounded-2xl border border-border bg-card/60 p-4 text-left text-sm">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Live caption</p>
              <p className="mt-2">
                “You mentioned JWT auth — where did you store the token, and why?”
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24">
        <h2 className="text-center text-3xl font-semibold">Built to feel like the real thing</h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-6"
            >
              <span className="gradient-primary mb-4 flex size-10 items-center justify-center rounded-xl">
                <f.icon className="size-5 text-primary-foreground" />
              </span>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24">
        <h2 className="text-center text-3xl font-semibold">How it works</h2>
        <div className="mt-12 grid gap-4 md:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="glass rounded-2xl p-6">
              <span className="text-gradient font-display text-3xl font-bold">{s.n}</span>
              <h3 className="mt-3 text-lg font-semibold">{s.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-28">
        <div className="glass glow relative overflow-hidden rounded-3xl p-10 text-center">
          <h2 className="text-3xl font-semibold">Your next interview shouldn't be your first</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Run a full MERN stack mock interview in the next five minutes.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link to="/auth" search={{ mode: "signup" }}>
              Start free <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 text-sm text-muted-foreground">
          <Logo />
          <div className="flex gap-4">
            <Link to="/features">Features</Link>
            <Link to="/how-it-works">How it works</Link>
            <Link to="/auth">Log in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
