import { useState, useTransition } from "react";
import { Button } from "@/components/common/Button";
import { translateAuthError } from "@/components/auth/authErrors";
import { getSupabaseClient } from "@/lib/supabase";

interface SignUpFormProps {
  onSwitchMode: () => void;
}

export function SignUpForm({ onSwitchMode }: SignUpFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage("비밀번호가 서로 일치하지 않습니다.");
      return;
    }

    startTransition(async () => {
      try {
        const supabase = getSupabaseClient();
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) {
          throw error;
        }

        setSuccessMessage(
          "가입이 완료되었습니다. 이메일 인증이 필요한 경우 받은 편지함을 확인한 뒤 로그인해 주세요.",
        );
      } catch (error) {
        setErrorMessage(
          translateAuthError(error, "계정 생성에 실패했습니다. 잠시 후 다시 시도해 주세요."),
        );
      }
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label
          htmlFor="signup-email"
          className="text-sm text-slate-200"
        >
          이메일
        </label>
        <input
          id="signup-email"
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
          htmlFor="signup-password"
          className="text-sm text-slate-200"
        >
          비밀번호
        </label>
        <input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="min-h-11 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-brand-cyan/70 focus:ring-2 focus:ring-brand-cyan/30"
          placeholder="6자 이상"
          minLength={6}
          required
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="signup-password-confirm"
          className="text-sm text-slate-200"
        >
          비밀번호 확인
        </label>
        <input
          id="signup-password-confirm"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="min-h-11 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-brand-cyan/70 focus:ring-2 focus:ring-brand-cyan/30"
          placeholder="비밀번호 다시 입력"
          minLength={6}
          required
        />
      </div>

      {errorMessage ? (
        <p className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200 [word-break:keep-all]">
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200 [word-break:keep-all]">
          {successMessage}
        </p>
      ) : null}

      <div className="space-y-3">
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "계정 만드는 중..." : "가입하기"}
        </Button>
        <Button
          type="button"
          tone="ghost"
          className="w-full"
          onClick={onSwitchMode}
          disabled={isPending}
        >
          로그인으로 돌아가기
        </Button>
      </div>
    </form>
  );
}
