import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { z } from "zod";
import { Aurora, Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({
  mode: z.enum(["login", "signup"]).optional(),
  redirect: z.string().optional(),
});

/**
 * Password rule: at least 8 characters. Letters, numbers and special
 * characters are all allowed — no character-class requirements, so normal
 * strong passwords are never rejected by the client.
 */
const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters." })
  .max(72, { message: "Password must be 72 characters or fewer." });

const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Enter a valid email address." })
    .max(255, { message: "Email must be less than 255 characters." }),
  password: passwordSchema,
});


export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Log in or sign up — InterviewAI" },
      {
        name: "description",
        content: "Create your InterviewAI account and run your first AI mock interview in minutes.",
      },
      { property: "og:title", content: "Log in to InterviewAI" },
      { property: "og:description", content: "Access your AI mock interviews and score reports." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode, redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isSignup, setIsSignup] = useState(mode === "signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    if (!loading && user) void navigate({ to: redirect ?? "/dashboard" });
  }, [loading, user, navigate, redirect]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = credentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({ email: fieldErrors.email?.[0], password: fieldErrors.password?.[0] });
      return;
    }
    setErrors({});

    setBusy(true);
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { name },
          },
        });
        if (error) throw error;
        toast.success("Account created. Welcome to InterviewAI!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      if (/password/i.test(message)) setErrors({ password: message });
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }


  return (
    <div className="flex min-h-screen flex-col">
      <Aurora />
      <header className="mx-auto flex h-20 w-full max-w-7xl items-center px-4">
        <Logo />
      </header>
      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass w-full max-w-md rounded-3xl p-8"
        >
          <h1 className="font-display text-2xl font-semibold">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSignup
              ? "Start practicing with your AI interviewer today."
              : "Log in to continue your interview prep."}
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ananya Sharma"
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="you@example.com"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
                required
              />
              {errors.email && (
                <p id="email-error" className="text-xs text-destructive">
                  {errors.email}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                placeholder="At least 8 characters"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "password-error" : "password-hint"}
                required
              />
              {errors.password ? (
                <p id="password-error" className="text-xs text-destructive">
                  {errors.password}
                </p>
              ) : (
                <p id="password-hint" className="text-xs text-muted-foreground">
                  At least 8 characters. Letters, numbers and special characters are all allowed.
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Please wait…" : isSignup ? "Create account" : "Log in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignup ? "Already have an account?" : "New to InterviewAI?"}{" "}
            <button
              type="button"
              className="text-foreground underline underline-offset-4"
              onClick={() => setIsSignup((v) => !v)}
            >
              {isSignup ? "Log in" : "Create one"}
            </button>
          </p>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            <Link to="/">Back to home</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
