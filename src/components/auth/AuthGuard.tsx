import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { Card } from "@/components/common/Card";
import { PixelText } from "@/components/common/PixelText";
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
      <main className="pixel-grid-bg flex h-dvh items-center justify-center px-4">
        <Card className="w-full max-w-md space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-brand-cyan">
            Idolverse
          </p>
          <h1 className="text-2xl text-slate-50">세션 확인 중</h1>
          <p className="text-sm text-slate-400">
            프로듀서 계정을 불러오고 있습니다...
          </p>
        </Card>
      </main>
    );
  }

  if (!hasSupabaseEnv) {
    return (
      <main className="pixel-grid-bg flex h-dvh items-center justify-center px-4">
        <Card className="w-full max-w-md space-y-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.28em] text-brand-cyan">
              Supabase Setup
            </p>
            <h1 className="text-2xl text-slate-50">
              인증이 설정되지 않았습니다
            </h1>
            <p className="text-sm leading-6 text-slate-400 [word-break:keep-all]">
              로그인과 클라우드 저장을 사용하려면 `VITE_SUPABASE_URL`,
              `VITE_SUPABASE_PUBLISHABLE_KEY`를 로컬 환경 변수에 추가해 주세요.
            </p>
          </div>
        </Card>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="pixel-grid-bg h-dvh overflow-y-auto bg-slate-950 px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(2rem+env(safe-area-inset-top))]">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(236,72,153,0.18),_transparent_32%),radial-gradient(circle_at_bottom,_rgba(6,182,212,0.16),_transparent_28%)]" />
        <div className="stagger-fade relative mx-auto flex min-h-full w-full max-w-md flex-col justify-center-safe gap-4">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.34em] text-brand-cyan">
              K-POP Manager Sim
            </p>
            <PixelText as="h1" className="mt-2 text-5xl leading-none text-pink-200">
              IDOLVERSE
            </PixelText>
            <p className="mt-3 text-sm text-slate-400 [word-break:keep-all]">
              프로듀서 계정으로 로그인하면 진행 상황이 클라우드에 저장됩니다.
            </p>
          </div>

          <Card className="space-y-5">
            <div className="flex rounded-2xl bg-slate-950/70 p-1 ring-1 ring-white/10">
              {(
                [
                  { value: "login", label: "로그인" },
                  { value: "signup", label: "가입" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  className={[
                    "min-h-11 flex-1 rounded-xl text-sm transition duration-150 ease-out active:scale-[0.96]",
                    mode === tab.value
                      ? "bg-brand-pink text-white shadow-[0_2px_0_#9d174d]"
                      : "text-slate-400 hover:text-slate-200",
                  ].join(" ")}
                  onClick={() => setMode(tab.value)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <h2 className="text-xl text-slate-50">
                {mode === "login" ? "프로듀서 로그인" : "프로듀서 계정 만들기"}
              </h2>
              <p className="text-sm text-slate-400 [word-break:keep-all]">
                {mode === "login"
                  ? "이메일과 비밀번호로 로그인하세요."
                  : "이메일과 비밀번호만으로 바로 시작할 수 있습니다."}
              </p>
            </div>

            {mode === "login" ? (
              <LoginForm onSwitchMode={() => setMode("signup")} />
            ) : (
              <SignUpForm onSwitchMode={() => setMode("login")} />
            )}
          </Card>

          <p className="text-center text-xs leading-5 text-slate-500 [word-break:keep-all]">
            계정당 3개의 저장 슬롯이 제공되며, 주차가 넘어갈 때 자동 저장됩니다.
          </p>
        </div>
      </main>
    );
  }

  return <>{renderChildren(children, user)}</>;
}
