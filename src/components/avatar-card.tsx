import { motion } from "motion/react";
import { Check, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type AvatarRow = {
  id: string;
  name: string;
  short_description: string;
  thumbnail_url: string | null;
  voice_style: string;
  accent_color: string;
};

const ACCENTS: Record<string, string> = {
  primary: "from-primary/70 to-accent/60",
  accent: "from-accent/70 to-primary/50",
  success: "from-success/70 to-primary/40",
  warning: "from-warning/70 to-accent/40",
};

/** Feature 1 — selectable interviewer avatar (matches existing card styling). */
export function AvatarCard({
  avatar,
  selected,
  onSelect,
  onPreview,
}: {
  avatar: AvatarRow;
  selected: boolean;
  onSelect: () => void;
  onPreview?: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ y: -3 }}
      aria-pressed={selected}
      className={cn(
        "group relative rounded-2xl border p-4 text-left transition-all",
        selected
          ? "border-primary bg-primary/10 shadow-[0_0_0_1px_var(--primary)]"
          : "border-border bg-card/50 hover:border-primary/50",
      )}
    >
      <div
        className={cn(
          "flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br",
          ACCENTS[avatar.accent_color] ?? ACCENTS["primary"],
        )}
      >
        {avatar.thumbnail_url ? (
          <img
            src={avatar.thumbnail_url}
            alt={`${avatar.name}, AI interviewer persona`}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <span className="font-display text-4xl font-semibold text-primary-foreground">
            {avatar.name.charAt(0)}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium">{avatar.name}</p>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {avatar.short_description}
          </p>
        </div>
        {selected && (
          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="size-3" />
          </span>
        )}
      </div>

      {onPreview && (
        <span
          role="button"
          tabIndex={0}
          aria-label={`Hear ${avatar.name}'s voice`}
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              onPreview();
            }
          }}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Volume2 className="size-3.5" /> Hear voice
        </span>
      )}
    </motion.button>
  );
}
