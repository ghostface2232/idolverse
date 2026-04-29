import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { hasSupabaseEnv } from "@/lib/supabase";

export function AuthPanel() {
  return (
    <Card className="space-y-3">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.28em] text-brand-cyan">
          Authentication
        </p>
        <h2 className="text-lg text-slate-50">Supabase Gate</h2>
        <p className="text-sm text-slate-400">
          {hasSupabaseEnv
            ? "Supabase environment keys are present."
            : "Update .env.local before wiring real auth flows."}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button tone="secondary" disabled={!hasSupabaseEnv}>
          Sign In
        </Button>
        <Button tone="ghost" disabled={!hasSupabaseEnv}>
          Sign Up
        </Button>
      </div>
    </Card>
  );
}

