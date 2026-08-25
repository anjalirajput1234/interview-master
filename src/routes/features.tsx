import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Video,
  Mic,
  BarChart3,
  Brain,
  FileText,
  Languages,
  Gauge,
  ShieldCheck,
} from "lucide-react";
import { Aurora, Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — InterviewAI video mock interviews" },
      {
        name: "description",
        content:
          "Video AI interviewer, live speech-to-text, adaptive questioning, category scoring and downloadable reports.",
      },
      { property: "og:title", content: "InterviewAI features" },
      {
        property: "og:description",
        content: "Everything inside the AI interview room, from talking avatars to scored reports.",
      },
    ],
  }),
  component: FeaturesPage,
});

const FEATURES = [
  {
    icon: Video,
    title: "Face-to-face interview room",
    body: "Your webcam on one side, a talking AI interviewer on the other — the closest thing to the real call.",
  },
  {
    icon: Mic,
    title: "Speak your answers",
    body: "Browser speech-to-text transcribes you live, so you practise talking, not typing.",
  },
  {
    icon: Brain,
    title: "Adaptive questioning",
    body: "The interviewer follows up on weak answers and raises difficulty when you're doing well.",
  },
  {
    icon: BarChart3,
    title: "Category scoring",
    body: "Technical depth, communication, problem solving and confidence, each scored independently.",
  },
  {
    icon: FileText,
    title: "Downloadable report",
    body: "Take your feedback with you as a PDF you can review before the real interview.",
  },
  {
    icon: Languages,
    title: "English or Hinglish",
    body: "Practise in the language you'll actually be interviewed in.",
  },
  {
    icon: Gauge,
    title: "Delivery feedback",
    body: "Filler words and rambling answers get flagged alongside your content score.",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    body: "No recordings stored — only your transcript and scores, visible to you alone.",
  },
];

function FeaturesPage() {
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
      <main className="mx-auto max-w-7xl px-4 pb-24">
        <h1 className="font-display max-w-3xl text-4xl font-semibold md:text-5xl">
          Everything inside the interview room
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          InterviewAI recreates the pressure of a live interview and then hands you the feedback a
          real interviewer never gives you.
        </p>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="glass rounded-3xl p-6"
            >
              <div className="gradient-primary flex size-10 items-center justify-center rounded-xl text-primary-foreground">
                <f.icon className="size-5" />
              </div>
              <h2 className="mt-4 font-medium">{f.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
