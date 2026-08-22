import { motion } from "motion/react";
import { MicOff, VideoOff } from "lucide-react";
import type { Persona } from "@/lib/personas";
import { cn } from "@/lib/utils";

export function AvatarTile({
  persona,
  speaking,
  thinking,
  className,
}: {
  persona: Persona;
  speaking: boolean;
  thinking: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-2xl border border-border bg-card",
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-60"
        style={{
          background: `radial-gradient(120% 90% at 50% 110%, ${persona.accent}55, transparent 65%)`,
        }}
      />

      <motion.div
        animate={speaking ? { scale: [1, 1.03, 1] } : { scale: 1 }}
        transition={{ repeat: speaking ? Infinity : 0, duration: 1.6 }}
        className="relative flex flex-col items-center gap-4"
      >
        <div className="relative">
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full"
            animate={
              speaking
                ? { boxShadow: [`0 0 0 0 ${persona.accent}66`, `0 0 0 28px ${persona.accent}00`] }
                : {}
            }
            transition={{ repeat: speaking ? Infinity : 0, duration: 1.8 }}
          />
          {/* Stylised interviewer face — mouth animates while speaking (mock avatar adapter) */}
          <div
            className="relative flex size-32 items-center justify-center rounded-full sm:size-40"
            style={{ background: `linear-gradient(150deg, ${persona.accent}, oklch(0.3 0.06 280))` }}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="flex gap-5">
                <motion.span
                  className="block h-2.5 w-2.5 rounded-full bg-background/90"
                  animate={{ scaleY: [1, 1, 0.1, 1] }}
                  transition={{ repeat: Infinity, duration: 4.5, times: [0, 0.92, 0.96, 1] }}
                />
                <motion.span
                  className="block h-2.5 w-2.5 rounded-full bg-background/90"
                  animate={{ scaleY: [1, 1, 0.1, 1] }}
                  transition={{ repeat: Infinity, duration: 4.5, times: [0, 0.92, 0.96, 1] }}
                />
              </div>
              <motion.span
                className="block rounded-full bg-background/90"
                animate={
                  speaking
                    ? { height: [4, 14, 7, 16, 5], width: [26, 22, 28, 20, 26] }
                    : { height: 4, width: 26 }
                }
                transition={{ repeat: speaking ? Infinity : 0, duration: 0.55 }}
              />
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="font-display text-lg font-semibold">{persona.name}</p>
          <p className="text-xs text-muted-foreground">{persona.title}</p>
        </div>
      </motion.div>

      <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-background/70 px-3 py-1.5 text-xs backdrop-blur">
        <span
          className={cn(
            "size-2 rounded-full",
            speaking ? "bg-success" : thinking ? "bg-warning" : "bg-muted-foreground",
          )}
        />
        {speaking ? "Speaking" : thinking ? "Thinking…" : "Listening"}
      </div>
    </div>
  );
}

export function SelfTile({
  videoRef,
  cameraOn,
  micOn,
  permissionDenied,
  className,
  label = "You",
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  cameraOn: boolean;
  micOn: boolean;
  permissionDenied: boolean;
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-secondary/40",
        className,
      )}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={cn("size-full object-cover", !cameraOn && "invisible")}
      />
      {!cameraOn && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-muted-foreground">
          <VideoOff className="size-6" />
          <p className="px-4 text-xs">
            {permissionDenied ? "Camera unavailable — you can still answer by typing" : "Camera off"}
          </p>
        </div>
      )}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-background/70 px-3 py-1.5 text-xs backdrop-blur">
        {!micOn && <MicOff className="size-3" />}
        {label}
      </div>
    </div>
  );
}
