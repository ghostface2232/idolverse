import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";

type AuthMode = "login" | "signup";

interface AuthGuardProps {
  children: ReactNode | ((user: User) => ReactNode);
}

function renderChildren(
  children: AuthGuardProps["children"],
  user: User,
) {
  return typeof children === "function" ? children(user) : children;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<AuthMode>("login");

  useEffect(() => {
    if (!hasSupabaseEnv || !supabase) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    void supabase.auth.getUser().then(({ data, error }) => {
      if (!isMounted) {
        return;
      }

      if (error) {
        console.error("Failed to fetch authenticated user.", error);
      }

      setUser(data.user ?? null);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-brand-cyan">
            Authentication
          </p>
          <h1 className="text-2xl text-slate-50">
            Checking Session
          </h1>
          <p className="text-sm text-slate-400">
            Restoring your producer account.
          </p>
        </Card>
      </main>
    );
  }

  if (!hasSupabaseEnv) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-8">
        <Card className="w-full max-w-lg space-y-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.28em] text-brand-cyan">
              Supabase Setup
            </p>
            <h1 className="text-2xl text-slate-50">
              Authentication Is Not Configured
            </h1>
            <p className="text-sm leading-6 text-slate-400">
              Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to your
              local environment before using auth or cloud save features.
            </p>
          </div>
        </Card>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(236,72,153,0.18),_transparent_32%),radial-gradient(circle_at_bottom,_rgba(6,182,212,0.16),_transparent_28%)]" />
        <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
          <div className="grid w-full gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <Card className="space-y-5 border-brand-cyan/15 bg-slate-900/68 p-6 lg:p-8">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.32em] text-brand-cyan">
                  Idolverse Access
                </p>
                <h1 className="max-w-md text-3xl leading-tight text-slate-50 lg:text-4xl">
                  Manage the group, sync progress, and keep your weekly run safe.
                </h1>
                <p className="max-w-xl text-sm leading-6 text-slate-400">
                  Supabase auth gates the producer account, and every cloud save
                  snapshot stores the full Zustand game state for the current run.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Slots
                  </p>
                  <p className="mt-2 text-2xl text-slate-100">3</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Fixed save slots per account
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Auto Save
                  </p>
                  <p className="mt-2 text-2xl text-slate-100">5w</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Triggered on week transitions
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Payload
                  </p>
                  <p className="mt-2 text-2xl text-slate-100">9</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Zustand domains serialized
                  </p>
                </div>
              </div>
            </Card>

            <Card className="space-y-5 p-6 lg:p-8">
              <div className="flex rounded-2xl bg-slate-950/70 p-1 ring-1 ring-white/10">
                <Button
                  tone={mode === "login" ? "primary" : "ghost"}
                  className="flex-1"
                  onClick={() => setMode("login")}
                >
                  Sign In
                </Button>
                <Button
                  tone={mode === "signup" ? "primary" : "ghost"}
                  className="flex-1"
                  onClick={() => setMode("signup")}
                >
                  Sign Up
                </Button>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl text-slate-50">
                  {mode === "login" ? "Producer Login" : "Create Producer Account"}
                </h2>
                <p className="text-sm text-slate-400">
                  {mode === "login"
                    ? "Use email and password to access cloud saves."
                    : "Email/password sign-up only. Social login is intentionally excluded from this phase."}
                </p>
              </div>

              {mode === "login" ? (
                <LoginForm onSwitchMode={() => setMode("signup")} />
              ) : (
                <SignUpForm onSwitchMode={() => setMode("login")} />
              )}
            </Card>
          </div>
        </div>
      </main>
    );
  }

  return <>{renderChildren(children, user)}</>;
}
