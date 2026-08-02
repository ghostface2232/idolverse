import { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Alert } from "@/components/common/Alert";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { MoneyDisplay } from "@/components/common/MoneyDisplay";
import { SceneThumb } from "@/components/visual/SceneThumb";
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
  onConfirm: (allocation: MarketingPlanAllocation) => void | Promise<void>;
}

export function MarketingPlanModal({
  albumTitle,
  money,
  isSaving,
  errorMessage,
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

  const adjust = (channelId: MarketingChannelId, delta: number) => {
    setAllocation((current) => {
      const next = current[channelId] + delta;
      if (next < 0 || next > MARKETING_PLAN.maxPerChannel) return current;
      if (delta > 0 && totalPoints >= MARKETING_PLAN.maxTotalPoints) {
        return current;
      }
      return { ...current, [channelId]: next };
    });
  };

  return (
    <Modal
      title="발매 전 마케팅 캠페인"
      onClose={() => undefined}
      isCloseDisabled
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
            {MARKETING_PLAN.maxTotalPoints}포인트, 포인트당{" "}
            <MoneyDisplay amount={MARKETING_PLAN.costPerPoint} size="sm" />
            이며, 효과는 발매 주에 나타납니다.
          </p>
        </div>

        <div className="space-y-2">
          {MARKETING_CHANNELS.map((channel) => {
            const points = allocation[channel.id];
            return (
              <div
                key={channel.id}
                className={[
                  "rounded-2xl border-2 p-3 transition-colors duration-150",
                  points > 0
                    ? "border-brand-cyan/50 bg-brand-cyan/[0.06]"
                    : "border-white/10 bg-white/[0.03]",
                ].join(" ")}
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
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      aria-label={`${channel.label} 포인트 줄이기`}
                      disabled={isSaving || points === 0}
                      className="grid size-9 place-items-center rounded-xl bg-white/[0.06] text-text-secondary transition active:scale-[0.92] disabled:opacity-35"
                      onClick={() => adjust(channel.id, -1)}
                    >
                      <Minus className="size-4" aria-hidden="true" />
                    </button>
                    <span className="w-4 text-center text-sm font-semibold tabular-nums text-text-primary">
                      {points}
                    </span>
                    <button
                      type="button"
                      aria-label={`${channel.label} 포인트 올리기`}
                      disabled={
                        isSaving ||
                        points >= MARKETING_PLAN.maxPerChannel ||
                        totalPoints >= MARKETING_PLAN.maxTotalPoints
                      }
                      className="grid size-9 place-items-center rounded-xl bg-white/[0.06] text-text-secondary transition active:scale-[0.92] disabled:opacity-35"
                      onClick={() => adjust(channel.id, 1)}
                    >
                      <Plus className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between rounded-xl bg-surface-shell/72 px-3 py-2 text-xs">
          <span className="text-text-muted">
            {totalPoints}/{MARKETING_PLAN.maxTotalPoints}포인트 배분
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
