import { Activity, HeartPulse, Star, UserRound } from "lucide-react";
import { TEMPERAMENT_PROFILES } from "@/data/balance";
import { traitLabels } from "@/data/memberTraits";
import { useTraineeStore } from "@/stores/traineeStore";

export function MemberOverview() {
  const trainees = useTraineeStore((state) => state.trainees);
  const maxPopularity = trainees.reduce(
    (max, trainee) => Math.max(max, trainee.popularity ?? 0),
    0,
  );

  return (
    <section className="h-full overflow-y-auto p-4">
      <header className="mb-4">
        <p className="text-xs font-semibold text-action-secondary">ROSTER</p>
        <h1 className="mt-1 text-xl font-semibold text-text-primary">멤버 현황</h1>
        <p className="mt-1 text-sm text-text-muted">포지션과 이번 주 컨디션을 확인합니다.</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {trainees.map((trainee) => (
          <article
            key={trainee.id}
            className="rounded-3xl bg-surface-panel p-4 shadow-[var(--shadow-surface)]"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-action-primary/14 text-pink-200 shadow-[var(--shadow-surface)]">
                <UserRound className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="flex items-center gap-1.5 truncate font-semibold text-text-primary">
                  {trainee.name}
                  {maxPopularity > 0 && (trainee.popularity ?? 0) === maxPopularity ? (
                    <span
                      className="rounded-md bg-amber-400/15 px-1 py-0.5 text-[10px] font-semibold text-amber-200"
                      title="팀 내 최고 인기"
                    >
                      인기 1위
                    </span>
                  ) : null}
                </h2>
                <p className="truncate text-xs text-text-muted">
                  {trainee.position ?? "포지션 미정"} ·{" "}
                  {traitLabels(trainee).join("·")} ·{" "}
                  {TEMPERAMENT_PROFILES[trainee.temperament ?? "steady"].label} ·{" "}
                  처우 {trainee.contract?.tier ?? 1}등급
                </p>
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-xl bg-surface-shell/70 p-2.5">
                <dt className="flex items-center gap-1.5 text-text-muted">
                  <HeartPulse className="size-3.5" aria-hidden="true" /> 컨디션
                </dt>
                <dd className="mt-1 font-semibold tabular-nums text-text-primary">
                  {trainee.condition}
                </dd>
              </div>
              <div className="rounded-xl bg-surface-shell/70 p-2.5">
                <dt className="flex items-center gap-1.5 text-text-muted">
                  <Activity className="size-3.5" aria-hidden="true" /> 활동
                </dt>
                <dd className="mt-1 truncate font-semibold text-text-primary">
                  {activityLabel(trainee.currentActivity)}
                </dd>
              </div>
              <div className="rounded-xl bg-surface-shell/70 p-2.5">
                <dt className="flex items-center gap-1.5 text-text-muted">
                  <Star className="size-3.5" aria-hidden="true" /> 인기
                </dt>
                <dd className="mt-1 font-semibold tabular-nums text-text-primary">
                  {Math.round(trainee.popularity ?? 0)}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
      {trainees.length === 0 ? (
        <p className="rounded-3xl bg-surface-panel p-8 text-center text-sm text-text-muted shadow-[var(--shadow-surface)]">
          등록된 멤버가 없습니다.
        </p>
      ) : null}
    </section>
  );
}

function activityLabel(activity: string | null) {
  return {
    training: "팀 훈련",
    individual: "개인 레슨",
    entertainment: "외부 활동",
    rest: "휴식",
    vacation: "휴가",
  }[activity ?? ""] ?? "대기";
}
