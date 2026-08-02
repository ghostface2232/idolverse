import { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Alert } from "@/components/common/Alert";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { MoneyDisplay } from "@/components/common/MoneyDisplay";
import { SceneThumb } from "@/components/visual/SceneThumb";
import { formatKoreanWon } from "@/utils/formatKoreanWon";
import { MARKETING_CHANNELS, MARKETING_PLAN } from "@/data/balance";
import type {
  MarketingChannelId,
  MarketingPlanAllocation,
} from "@/types/game";

interface MarketingPlanModalProps {
  albumTitle: string;
  money: number;
  isSaving: boolean;
  errorMessage?: string | null;
  stepLabel?: string;
  onConfirm: (allocation: MarketingPlanAllocation) => void | Promise<void>;
}

export function MarketingPlanModal({
  albumTitle,
  money,
  isSaving,
  errorMessage,
  stepLabel,
  onConfirm,
}: MarketingPlanModalProps) {
  const [allocation, setAllocation] = useState<
    Record<MarketingChannelId, number>
  >({ sns: 0, broadcast: 0, fanpower: 0, global: 0 });

  const totalPoints = useMemo(
    () => Object.values(allocation).reduce((sum, points) => sum + points, 0),
    [allocation],
  );
  const totalCost = totalPoints * MARKETING_PLAN.costPerPoint;
  const canAfford = totalCost <= money;

  // 예산을 넘는 배정은 처음부터 막는다 — 담게 두고 나중에 벌하지 않는다.
  const canAddMore =
    totalPoints < MARKETING_PLAN.maxTotalPoints &&
    totalCost + MARKETING_PLAN.costPerPoint <= money;

  const adjust = (channelId: MarketingChannelId, delta: number) => {
    setAllocation((current) => {
      const next = current[channelId] + delta;
      if (next < 0 || next > MARKETING_PLAN.maxPerChannel) return current;
      if (delta > 0 && !canAddMore) return current;
      return { ...current, [channelId]: next };
    });
  };

  return (
    <Modal
      title="발매 전 마케팅 캠페인"
      forced
      stepLabel={stepLabel}
      footer={
        <Button
          className="w-full"
          isDisabled={isSaving || !canAfford}
          onPress={() => void onConfirm(allocation)}
        >
          {isSaving
            ? "저장 중…"
            : !canAfford
              ? "예산 부족"
              : totalPoints === 0
                ? "캠페인 없이 발매 준비"
                : "이 배분으로 캠페인 집행"}
        </Button>
      }
    >
      <div className="space-y-4 text-sm [word-break:keep-all]">
        <div>
          <SceneThumb scene="marketing" variant="banner" label={albumTitle} />
          <h2 className="mt-3 text-balance text-lg font-semibold text-text-primary">
            발매 화력을 어디에 집중할까요?
          </h2>
          <p className="mt-2 text-pretty leading-6 text-text-secondary">
            채널마다 반응하는 팬층이 다릅니다. 최대{" "}
            {MARKETING_PLAN.maxTotalPoints}구좌까지 집행할 수 있고 구좌당{" "}
            {formatKoreanWon(MARKETING_PLAN.costPerPoint)}이 들며, 성과는
            발매 주에 드러납니다.
          </p>
        </div>

        <div className="space-y-2">
          {MARKETING_CHANNELS.map((channel) => {
            const points = allocation[channel.id];
            return (
              <div
                key={channel.id}
                className="rounded-2xl bg-surface-shell/72 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary">
                      {channel.label}
                    </p>
                    <p className="mt-0.5 text-pretty text-[11px] leading-4 text-text-muted">
                      {channel.summary}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center">
                    <button
                      type="button"
                      aria-label={`${channel.label} 배정 줄이기`}
                      disabled={isSaving || points === 0}
                      className="grid min-h-11 min-w-11 place-items-center transition active:scale-[0.96] disabled:opacity-45"
                      onClick={() => adjust(channel.id, -1)}
                    >
                      <span className="grid size-8 place-items-center rounded-xl bg-white/[0.06] text-text-secondary">
                        <Minus className="size-4" aria-hidden="true" />
                      </span>
                    </button>
                    <span
                      aria-live="polite"
                      className={[
                        "w-5 text-center text-sm font-semibold tabular-nums",
                        points > 0 ? "text-emerald-200" : "text-text-primary",
                      ].join(" ")}
                    >
                      {points}
                    </span>
                    <button
                      type="button"
                      aria-label={`${channel.label} 배정 늘리기`}
                      disabled={
                        isSaving ||
                        points >= MARKETING_PLAN.maxPerChannel ||
                        !canAddMore
                      }
                      className="grid min-h-11 min-w-11 place-items-center transition active:scale-[0.96] disabled:opacity-45"
                      onClick={() => adjust(channel.id, 1)}
                    >
                      <span className="grid size-8 place-items-center rounded-xl bg-white/[0.06] text-text-secondary">
                        <Plus className="size-4" aria-hidden="true" />
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between rounded-xl bg-surface-shell/72 px-3 py-2 text-xs">
          <span className="tabular-nums text-text-muted">
            {totalPoints}/{MARKETING_PLAN.maxTotalPoints}구좌 배정
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-text-primary">
            총 비용 <MoneyDisplay amount={totalCost} size="sm" />
          </span>
        </div>

        {errorMessage ? <Alert message={errorMessage} /> : null}
      </div>
    </Modal>
  );
}
