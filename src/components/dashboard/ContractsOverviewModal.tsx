import { CalendarClock, HeartHandshake, UserRound } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { CONTRACT_TERM_WEEKS } from "@/data/balance";
import { POSITION_LABELS } from "@/data/founding";
import {
  getContractRemainingWeeks,
  getContractSentiment,
  type ContractSentiment,
} from "@/systems/contractSystem";
import type { Trainee } from "@/types/game";

interface ContractsOverviewModalProps {
  trainees: readonly Trainee[];
  currentYear: number;
  currentWeek: number;
  onClose: () => void;
}

const SENTIMENT_COPY: Record<
  ContractSentiment,
  { label: string; description: string; style: string }
> = {
  satisfied: {
    label: "만족",
    description: "팀의 방향과 현재 대우에 만족하고 있습니다.",
    style: "bg-state-success/10 text-emerald-200",
  },
  neutral: {
    label: "중간",
    description: "큰 불만은 없지만 다음 활동과 약속을 지켜보고 있습니다.",
    style: "bg-white/[0.055] text-text-secondary",
  },
  dissatisfied: {
    label: "불만",
    description: "최근 운영에 불만이 쌓여 계약 관계가 흔들리고 있습니다.",
    style: "bg-state-warning/10 text-amber-100",
  },
};

function formatContractPeriod(remainingWeeks: number): string {
  const years = Math.floor(remainingWeeks / 52);
  const weeks = remainingWeeks % 52;
  if (years > 0 && weeks > 0) return `${years}년 ${weeks}주`;
  if (years > 0) return `${years}년`;
  return `${weeks}주`;
}

function MemberContractRow({
  trainee,
  remainingWeeks,
}: {
  trainee: Trainee;
  remainingWeeks: number;
}) {
  const sentiment = getContractSentiment(trainee.satisfaction);
  const sentimentCopy = SENTIMENT_COPY[sentiment];
  const satisfaction = Math.round(Math.min(100, Math.max(0, trainee.satisfaction)));

  return (
    <article className="rounded-2xl bg-surface-shell/68 p-4 shadow-[var(--shadow-surface)]">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.055] text-text-secondary">
          <UserRound className="size-4.5" strokeWidth={1.8} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-semibold text-text-primary">
                {trainee.name}
              </h3>
              <p className="mt-0.5 truncate text-xs text-text-muted">
                {trainee.position ? POSITION_LABELS[trainee.position] : "포지션 미정"}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${sentimentCopy.style}`}
            >
              {sentimentCopy.label}
            </span>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            {sentimentCopy.description}
          </p>

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-white/8 pt-3 text-xs">
            <div>
              <dt className="text-text-muted">남은 계약</dt>
              <dd className="mt-1 font-semibold tabular-nums text-text-primary">
                {formatContractPeriod(remainingWeeks)}
              </dd>
            </div>
            <div>
              <dt className="text-text-muted">현재 만족도</dt>
              <dd className="mt-1 font-semibold tabular-nums text-text-primary">
                {satisfaction}/100
              </dd>
            </div>
          </dl>
          <span className="mt-2.5 block h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
            <span
              className={[
                "block h-full rounded-full",
                sentiment === "dissatisfied"
                  ? "bg-state-warning"
                  : sentiment === "satisfied"
                    ? "bg-state-success"
                    : "bg-text-muted",
              ].join(" ")}
              style={{ width: `${satisfaction}%` }}
            />
          </span>
        </div>
      </div>
    </article>
  );
}

export function ContractsOverviewModal({
  trainees,
  currentYear,
  currentWeek,
  onClose,
}: ContractsOverviewModalProps) {
  const remainingWeeks = getContractRemainingWeeks(currentYear, currentWeek);
  const remainingRatio = Math.max(
    0,
    Math.min(1, remainingWeeks / CONTRACT_TERM_WEEKS),
  );

  return (
    <Modal title="계약 브리핑" onClose={onClose} className="max-w-lg">
      <div className="space-y-6">
        <section className="rounded-2xl bg-surface-raised/72 p-4 shadow-[var(--shadow-surface)]">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-action-primary/12 text-pink-200">
              <CalendarClock className="size-4.5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-text-muted">전속계약 잔여 기간</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-text-primary">
                {formatContractPeriod(remainingWeeks)}
              </p>
              <p className="mt-1 text-xs tabular-nums text-text-muted">
                총 {CONTRACT_TERM_WEEKS}주 중 {remainingWeeks}주 남음
              </p>
            </div>
          </div>
          <span className="mt-4 block h-2 overflow-hidden rounded-full bg-white/[0.07]">
            <span
              className="block h-full rounded-full bg-action-primary"
              style={{ width: `${Math.round(remainingRatio * 100)}%` }}
            />
          </span>
        </section>

        <section aria-labelledby="member-contracts-heading">
          <div className="mb-3 flex items-center gap-2">
            <HeartHandshake
              className="size-4 text-action-primary"
              aria-hidden="true"
            />
            <div>
              <h2
                id="member-contracts-heading"
                className="text-sm font-semibold text-text-primary"
              >
                멤버별 계약 관계
              </h2>
              <p className="mt-0.5 text-xs text-text-muted">
                현재 만족도를 바탕으로 계약에 대한 생각을 정리했습니다.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {trainees.map((trainee) => (
              <MemberContractRow
                key={trainee.id}
                trainee={trainee}
                remainingWeeks={remainingWeeks}
              />
            ))}
            {trainees.length === 0 ? (
              <p className="rounded-2xl bg-surface-shell/68 px-4 py-6 text-center text-sm text-text-muted shadow-[var(--shadow-surface)]">
                계약을 확인할 멤버가 없습니다.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </Modal>
  );
}
