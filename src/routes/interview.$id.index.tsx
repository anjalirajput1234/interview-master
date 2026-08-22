import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import {
  Mic,
  MicOff,
  PhoneOff,
  Send,
  Video as VideoIcon,
  VideoOff,
  Volume2,
  VolumeX,
  Keyboard,
} from "lucide-react";
import { Aurora } from "@/components/brand";
import { AvatarTile, SelfTile } from "@/components/video-tile";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useRequireAuth } from "@/lib/auth";
import { getPersona } from "@/lib/personas";
import { createAvatarSession } from "@/lib/avatarProvider";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { completeInterview, getInterview, sendAnswer } from "@/lib/interview.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/interview/$id/")({
  head: () => ({
    meta: [
      { title: "Live interview room — InterviewAI" },
      {
        name: "description",
        content: "Your live AI video interview: the interviewer speaks, you answer by voice or text.",
      },
      { property: "og:title", content: "Live AI interview room" },
      { property: "og:description", content: "A realistic video mock interview with adaptive questions." },
    ],
  }),
  component: InterviewRoom,
});

type Line = { id: string; sender: string; message_text: string };

function InterviewRoom() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { loading, user } = useRequireAuth();

  const load = useServerFn(getInterview);
  const answer = useServerFn(sendAnswer);
  const complete = useServerFn(completeInterview);

  const { data, isLoading } = useQuery({
    queryKey: ["interview", id],
    queryFn: () => load({ data: { id } }),
    enabled: Boolean(user),
    refetchOnWindowFocus: false,
  });

  const persona = getPersona(data?.interview.avatar_persona as string | undefined);

  // ---- media ----
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [joined, setJoined] = useState(false);

  const startMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
      setPermissionDenied(false);
    } catch {
      setPermissionDenied(true);
      setCameraOn(false);
    }
  }, []);

  useEffect(() => {
    void startMedia();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [startMedia]);

  function toggleCamera() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return void startMedia();
    track.enabled = !track.enabled;
    setCameraOn(track.enabled);
  }

  // ---- avatar speech ----
  const [speaking, setSpeaking] = useState(false);
  const [caption, setCaption] = useState("");
  const [muted, setMuted] = useState(false);
  const spokenRef = useRef<Set<string>>(new Set());
  const sessionRef = useRef<ReturnType<typeof createAvatarSession> | null>(null);

  useEffect(() => {
    sessionRef.current = createAvatarSession(persona.id, {
      onStart: () => setSpeaking(true),
      onWord: (soFar) => setCaption(soFar),
      onEnd: () => setSpeaking(false),
    });
    return () => sessionRef.current?.stop();
  }, [persona.id]);

  const messages: Line[] = (data?.messages ?? []) as Line[];
  const lastAi = [...messages].reverse().find((m) => m.sender === "ai");

  const speak = useCallback(
    async (text: string) => {
      setCaption(text);
      if (muted) return;
      await sessionRef.current?.speak(text);
    },
    [muted],
  );

  useEffect(() => {
    if (!joined || !lastAi) return;
    if (spokenRef.current.has(lastAi.id)) return;
    spokenRef.current.add(lastAi.id);
    void speak(lastAi.message_text);
  }, [joined, lastAi, speak]);

  // ---- answering ----
  const sr = useSpeechRecognition();
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [ended, setEnded] = useState(false);

  const send = useMutation({
    mutationFn: (text: string) => answer({ data: { id, text } }),
    onSuccess: async (turn) => {
      sr.reset();
      setDraft("");
      spokenRef.current.add("pending");
      setCaption("");
      await speak(turn.reply);
      if (turn.shouldEnd) void finish();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not send your answer"),
  });

  const finishing = useMutation({
    mutationFn: () => complete({ data: { id } }),
    onSuccess: () => navigate({ to: "/interview/$id/result", params: { id } }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not generate your report"),
  });

  function finish() {
    if (ended) return;
    setEnded(true);
    sessionRef.current?.stop();
    sr.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    finishing.mutate();
  }

  function submitAnswer() {
    const text = (typing ? draft : sr.transcript || draft).trim();
    if (text.length < 2) {
      toast.error("Say or type a little more before submitting.");
      return;
    }
    sr.stop();
    sessionRef.current?.stop();
    setSpeaking(false);
    send.mutate(text);
  }

  function toggleMic() {
    if (!sr.supported) {
      setTyping(true);
      toast.info("Voice input isn't supported in this browser — type your answer instead.");
      return;
    }
    if (sr.listening) sr.stop();
    else {
      sessionRef.current?.stop();
      setSpeaking(false);
      sr.start();
    }
  }

  // ---- turn counters ----
  const asked = messages.filter((m) => m.sender === "ai").length;
  const budget = data?.budget ?? 8;
  const progress = Math.min(100, Math.round((asked / budget) * 100));

  if (loading || isLoading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!joined) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <Aurora />
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass w-full max-w-3xl rounded-3xl p-6"
        >
          <h1 className="font-display text-2xl font-semibold">Camera & mic check</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {persona.name} is ready to interview you for {data.interview.role}.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <SelfTile
              videoRef={videoRef}
              cameraOn={cameraOn}
              micOn
              permissionDenied={permissionDenied}
              className="aspect-video"
            />
            <div className="space-y-3 rounded-2xl border border-border bg-card/50 p-4 text-sm">
              <Row label="Camera" ok={cameraOn} okText="Ready" badText="Off / blocked" />
              <Row
                label="Microphone"
                ok={!permissionDenied}
                okText="Ready"
                badText="Blocked — type instead"
              />
              <Row
                label="Speech-to-text"
                ok={sr.supported}
                okText="Supported"
                badText="Use typed answers"
              />
              <Row
                label="Interviewer voice"
                ok={Boolean(sessionRef.current?.supported)}
                okText={persona.name}
                badText="Captions only"
              />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => setJoined(true)}>
              Join interview
            </Button>
            <Button size="lg" variant="outline" onClick={() => void startMedia()}>
              Retry devices
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Aurora />
      <header className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 rounded-full bg-destructive/15 px-3 py-1 text-xs text-destructive">
            <span className="size-2 animate-pulse rounded-full bg-destructive" /> LIVE
          </span>
          <p className="text-sm font-medium">{data.interview.role}</p>
          <Badge variant="outline" className="hidden sm:inline-flex">
            {data.interview.interview_type}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Question {Math.min(asked, budget)} / {budget}
          </span>
          <div className="hidden h-1.5 w-32 overflow-hidden rounded-full bg-secondary sm:block">
            <div className="gradient-primary h-full" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1400px] flex-1 gap-4 p-4 lg:grid-cols-[1.5fr_1fr]">
        <AvatarTile
          persona={persona}
          speaking={speaking}
          thinking={send.isPending}
          className="min-h-[320px] lg:min-h-[520px]"
        />

        <div className="grid gap-4 lg:grid-rows-[auto_1fr]">
          <SelfTile
            videoRef={videoRef}
            cameraOn={cameraOn}
            micOn={sr.listening}
            permissionDenied={permissionDenied}
            className="aspect-video"
          />

          <div className="glass flex min-h-[220px] flex-col rounded-2xl p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {send.isPending ? `${persona.name} is thinking…` : "Current question"}
            </p>
            <p className="mt-2 flex-1 text-sm leading-relaxed">
              {caption || lastAi?.message_text || "…"}
            </p>

            <AnimatePresence>
              {(sr.listening || sr.transcript) && !typing && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 rounded-xl border border-border bg-secondary/40 p-3 text-sm"
                >
                  <span className="text-xs text-muted-foreground">You: </span>
                  {sr.transcript || "Listening…"}
                </motion.p>
              )}
            </AnimatePresence>

            {typing && (
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type your answer…"
                className="mt-3 min-h-24"
              />
            )}
          </div>
        </div>
      </main>

      <footer className="sticky bottom-0 border-t border-border/60 bg-background/80 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-center gap-3">
          <ControlButton
            active={sr.listening}
            onClick={toggleMic}
            label={sr.listening ? "Stop mic" : "Speak"}
            icon={sr.listening ? Mic : MicOff}
          />
          <ControlButton
            active={cameraOn}
            onClick={toggleCamera}
            label={cameraOn ? "Camera on" : "Camera off"}
            icon={cameraOn ? VideoIcon : VideoOff}
          />
          <ControlButton
            active={!muted}
            onClick={() => {
              setMuted((m) => !m);
              sessionRef.current?.stop();
              setSpeaking(false);
            }}
            label={muted ? "Voice off" : "Voice on"}
            icon={muted ? VolumeX : Volume2}
          />
          <ControlButton
            active={typing}
            onClick={() => setTyping((t) => !t)}
            label="Type"
            icon={Keyboard}
          />
          <Button
            size="lg"
            onClick={submitAnswer}
            disabled={send.isPending || finishing.isPending}
            className="min-w-40"
          >
            <Send className="mr-1 size-4" />
            {send.isPending ? "Sending…" : "Submit answer"}
          </Button>
          <Button
            size="lg"
            variant="destructive"
            onClick={finish}
            disabled={finishing.isPending}
          >
            <PhoneOff className="mr-1 size-4" />
            {finishing.isPending ? "Scoring…" : "End & get report"}
          </Button>
        </div>
      </footer>
    </div>
  );
}

function Row({
  label,
  ok,
  okText,
  badText,
}: {
  label: string;
  ok: boolean;
  okText: string;
  badText: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("flex items-center gap-2", ok ? "text-success" : "text-warning")}>
        <span className={cn("size-2 rounded-full", ok ? "bg-success" : "bg-warning")} />
        {ok ? okText : badText}
      </span>
    </div>
  );
}

function ControlButton({
  active,
  onClick,
  label,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 rounded-2xl border px-4 py-2 text-xs transition-colors",
        active
          ? "border-primary bg-primary/15 text-foreground"
          : "border-border bg-card/60 text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-5" />
      {label}
    </button>
  );
}
