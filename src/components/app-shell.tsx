import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  MessageSquarePlus,
  History,
  GraduationCap,
  User,
  Shield,
  LogOut,
  Menu,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Logo, Aurora } from "./brand";
import { Button } from "@/components/ui/button";
import { useAuth, useRequireAuth } from "@/lib/auth";
import { getMe } from "@/lib/interview.functions";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/interview/new", label: "Start Interview", icon: MessageSquarePlus },
  { to: "/practice", label: "Practice", icon: GraduationCap },
  { to: "/history", label: "History", icon: History },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function useMe() {
  const { user } = useAuth();
  const fn = useServerFn(getMe);
  return useQuery({
    queryKey: ["me", user?.id],
    queryFn: () => fn(),
    enabled: Boolean(user),
  });
}

export function AppShell({
  children,
  title,
  subtitle,
  wide,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string | undefined;
  wide?: boolean;
}) {
  const { loading, user } = useRequireAuth();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const me = useMe();
  const [open, setOpen] = useState(false);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const links = [
    ...NAV,
    ...(me.data?.isAdmin ? [{ to: "/admin", label: "Question Bank", icon: Shield } as const] : []),
  ];

  return (
    <div className="min-h-screen">
      <Aurora />
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Logo />
            <nav className="hidden items-center gap-1 lg:flex">
              {links.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  activeProps={{ className: "bg-secondary text-foreground" }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {me.data?.profile?.name || user.email}
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sign out"
              onClick={async () => {
                await signOut();
                void navigate({ to: "/" });
              }}
            >
              <LogOut className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Menu"
              onClick={() => setOpen((v) => !v)}
            >
              <Menu className="size-4" />
            </Button>
          </div>
        </div>
        {open && (
          <nav className="grid gap-1 border-t border-border/60 p-3 lg:hidden">
            {links.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-secondary text-foreground" }}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className={cn("mx-auto px-4 py-8", wide ? "max-w-[1400px]" : "max-w-7xl")}>
        {title && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-semibold">{title}</h1>
            {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
          </motion.div>
        )}
        {children}
      </main>
    </div>
  );
}
