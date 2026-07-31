import { Activity, ChevronRight, HeartPulse, ShieldAlert, Star } from "lucide-react";
import { SectionHeader } from "@/components/common/SectionHeader";
import { MemberPortrait } from "@/components/visual/MemberPortrait";
import { TEMPERAMENT_PROFILES } from "@/data/balance";
import { POSITION_LABELS } from "@/data/founding";
import { traitLabels } from "@/data/memberTraits";
import { useTraineeStore } from "@/stores/traineeStore";

interface MemberOverviewProps {
  onSelectTrainee: (traineeId: string) => void;
}

export function MemberOverview({ onSelectTrainee }: MemberOverviewProps) {
  const trainees = useTraineeStore((state) => state.trainees);
  const maxPopularity = trainees.reduce(
    (max, trainee) => Math.max(max, trainee.popularity ?? 0),
    0,
  );
  const averageCondition =
    trainees.length > 0
      ? Math.round(
          trainees.reduce((sum, trainee) => sum + trainee.condition, 0) /
            trainees.length,
        )
      : 0;
  const attentionCount = trainees.filter(
    (trainee) => trainee.injuryWeeks > 0 || trainee.condition < 50,
  ).length;

  return (
    <section className="h-full overflow-y-auto p-4 sm:p-5">
      <div className="mx-auto max-w-xl">
        <SectionHeader
          title="멤버"
        />
        <div className="mb-3 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-surface-panel px-3 py-2.5 shadow-[var(--shadow-surface)]">
            <p className="flex items-center gap-1.5 text-[11px] text-text-muted">
              <HeartPulse className="size-3.5 text-action-secondary" aria-hidden="true" />
              팀 평균 컨디션
            </p>
            <p className="mt-0.5 text-base font-semibold tabular-nums text-text-primary">
              {averageCondition}
            </p>
          </div>
          <div
            className={[
              "rounded-2xl px-3 py-2.5 shadow-[var(--shadow-surface)]",
              attentionCount > 0 ? "bg-state-danger/10" : "bg-surface-panel",
            ].join(" ")}
          >
            <p className="flex items-center gap-1.5 text-[11px] text-text-muted">
              <ShieldAlert
                className={[
                  "size-3.5",
                  attentionCount > 0 ? "text-state-danger" : "text-state-success",
                ].join(" ")}
                aria-hidden="true"
              />
              관리 필요
            </p>
            <p className="mt-0.5 text-base font-semibold tabular-nums text-text-primary">
              {attentionCount}명
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {trainees.map((trainee) => (
            <button
              key={trainee.id}
              type="button"
              className="rounded-3xl bg-surface-panel p-3.5 text-left shadow-[var(--shadow-surface)] transition-transform duration-[var(--motion-press)] active:scale-[0.96]"
              onClick={() => onSelectTrainee(trainee.id)}
            >
              <div className="flex items-center gap-3">
                <span className="relative shrink-0">
                  <MemberPortrait traineeId={trainee.id} size="lg" />
                </span>
                <div className="min-w-0 flex-1">
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
                  <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-text-muted">
                    {trainee.injuryWeeks > 0 ? (
                      <span className="rounded-md bg-state-danger/15 px-1.5 py-0.5 font-semibold text-state-danger">
                        부상 {trainee.injuryWeeks}주
                      </span>
                    ) : null}
                    <span className="rounded-md bg-white/[0.05] px-1.5 py-0.5">
                      {trainee.position ? POSITION_LABELS[trainee.position] : "포지션 미정"}
                    </span>
                    {traitLabels(trainee)
                      .slice(0, 1)
                      .map((label) => (
                        <span key={label} className="rounded-md bg-white/[0.05] px-1.5 py-0.5">
                          {label}
                        </span>
                      ))}
                    <span className="rounded-md bg-white/[0.05] px-1.5 py-0.5">
                      {TEMPERAMENT_PROFILES[trainee.temperament ?? "steady"].label}
                    </span>
                  </div>
                </div>
                <ChevronRight
                  className="size-4 shrink-0 text-text-muted"
                  aria-hidden="true"
                />
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-1.5 text-xs">
                <div className="rounded-xl bg-surface-shell/70 p-2">
                  <dt className="flex items-center gap-1.5 text-text-muted">
                    <HeartPulse className="size-3.5" aria-hidden="true" /> 컨디션
                  </dt>
                  <dd className="mt-1 font-semibold tabular-nums text-text-primary">
                    {Math.round(trainee.condition)}
                  </dd>
                </div>
                <div className="rounded-xl bg-surface-shell/70 p-2">
                  <dt className="flex items-center gap-1.5 text-text-muted">
                    <Activity className="size-3.5" aria-hidden="true" /> 활동
                  </dt>
                  <dd className="mt-1 truncate font-semibold text-text-primary">
                    {activityLabel(trainee.currentActivity)}
                  </dd>
                </div>
                <div className="rounded-xl bg-surface-shell/70 p-2">
                  <dt className="flex items-center gap-1.5 text-text-muted">
                    <Star className="size-3.5" aria-hidden="true" /> 인기
                  </dt>
                  <dd className="mt-1 font-semibold tabular-nums text-text-primary">
                    {Math.round(trainee.popularity ?? 0)}
                  </dd>
                </div>
              </dl>
            </button>
          ))}
        </div>
        {trainees.length === 0 ? (
          <p className="rounded-3xl bg-surface-panel p-8 text-center text-sm text-text-muted shadow-[var(--shadow-surface)]">
            등록된 멤버가 없습니다.
          </p>
        ) : null}
      </div>
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
