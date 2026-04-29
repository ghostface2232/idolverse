import { useState, useTransition } from "react";
import { Button } from "@/components/common/Button";
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
      setErrorMessage("Passwords do not match.");
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
          "Sign-up complete. Check your email if confirmation is enabled, then sign in.",
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to create account.",
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
          Email
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
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="min-h-11 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-brand-cyan/70 focus:ring-2 focus:ring-brand-cyan/30"
          placeholder="Minimum 6 characters"
          minLength={6}
          required
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="signup-password-confirm"
          className="text-sm text-slate-200"
        >
          Confirm Password
        </label>
        <input
          id="signup-password-confirm"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="min-h-11 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-brand-cyan/70 focus:ring-2 focus:ring-brand-cyan/30"
          placeholder="Repeat password"
          minLength={6}
          required
        />
      </div>

      {errorMessage ? (
        <p className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          {successMessage}
        </p>
      ) : null}

      <div className="space-y-3">
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Creating Account..." : "Sign Up"}
        </Button>
        <Button
          type="button"
          tone="ghost"
          className="w-full"
          onClick={onSwitchMode}
          disabled={isPending}
        >
          Back To Sign In
        </Button>
      </div>
    </form>
  );
}
