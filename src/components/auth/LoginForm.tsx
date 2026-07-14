import { useState, useTransition } from "react";
import { Button } from "@/components/common/Button";
import { translateAuthError } from "@/components/auth/authErrors";
import { getSupabaseClient } from "@/lib/supabase";

interface LoginFormProps {
  onSwitchMode: () => void;
}

export function LoginForm({ onSwitchMode }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const supabase = getSupabaseClient();
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          throw error;
        }
      } catch (error) {
        setErrorMessage(
          translateAuthError(error, "로그인에 실패했습니다. 잠시 후 다시 시도해 주세요."),
        );
      }
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label
          htmlFor="login-email"
          className="text-sm text-slate-200"
        >
          이메일
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="min-h-11 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-brand-cyan/70 focus:ring-2 focus:ring-brand-cyan/30"
          placeholder="producer@idolverse.gg"
          required
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="login-password"
          className="text-sm text-slate-200"
        >
          비밀번호
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="min-h-11 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-brand-cyan/70 focus:ring-2 focus:ring-brand-cyan/30"
          placeholder="비밀번호 입력"
          required
        />
      </div>

      {errorMessage ? (
        <p className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200 [word-break:keep-all]">
          {errorMessage}
        </p>
      ) : null}

      <div className="space-y-3">
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "로그인 중..." : "로그인"}
        </Button>
        <Button
          type="button"
          tone="ghost"
          className="w-full"
          onClick={onSwitchMode}
          disabled={isPending}
        >
          계정 만들기
        </Button>
      </div>
    </form>
  );
}
