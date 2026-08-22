import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2", className)}>
      <span className="gradient-primary flex size-8 items-center justify-center rounded-xl">
        <Sparkles className="size-4 text-primary-foreground" />
      </span>
      <span className="font-display text-lg font-semibold tracking-tight">InterviewAI</span>
    </Link>
  );
}

export function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="aurora-blob"
        style={{
          width: 520,
          height: 520,
          top: -160,
          left: -120,
          background: "var(--primary)",
        }}
      />
      <div
        className="aurora-blob"
        style={{
          width: 480,
          height: 480,
          top: 120,
          right: -160,
          background: "var(--primary-glow)",
        }}
      />
    </div>
  );
}
