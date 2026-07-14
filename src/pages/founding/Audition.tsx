import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { MoneyDisplay } from "@/components/common/MoneyDisplay";
import { radioTileClasses } from "@/components/common/selectionTokens";
import { FoundingTitleBar } from "@/components/founding/FoundingTitleBar";
import { TraineeCandidateCard } from "@/components/founding/TraineeCandidateCard";
import {
  FOUNDING_RECRUITMENT_COSTS,
  RECRUITMENT_HEADCOUNT_MULTIPLIER,
  getRecruitmentBudgetLabel,
  getRecruitmentStatRange,
  getStatBandLabel,
} from "@/data/founding";
import { generateTraineeCandidates } from "@/systems/recruitSystem";
import { financeVanillaStore, useFinanceStore } from "@/stores/financeStore";
import { traineeVanillaStore } from "@/stores/traineeStore";
import { useFoundingStore, foundingVanillaStore } from "@/stores/foundingStore";
import { useGameStore } from "@/stores/gameStore";

interface AuditionProps {
  onNext: () => void;
  onPrev: () => void;
}

const HEADCOUNTS = [5, 7, 9, 12] as const;
// 필수 포지션 4개(리더/메인보컬/메인댄서/센터)는 서로 겸직이 불가하므로 4명 미만이면 창단이 불가능하다.
const MIN_SELECT_COUNT = 4;

function formatKRW(amount: number): string {
  if (amount >= 100_000_000) {
    const eok = Math.floor(amount / 100_000_000);
    const remainderMan = Math.floor((amount % 100_000_000) / 10_000);
    return remainderMan > 0
      ? `₩${eok}억 ${remainderMan.toLocaleString()}만`
      : `₩${eok}억`;
  }
  return `₩${Math.floor(amount / 10_000).toLocaleString()}만`;
}

export function Audition({ onNext, onPrev }: AuditionProps) {
  const money = useFinanceStore((s) => s.money);
  const groupGender = useGameStore((s) => s.groupGender);

  const method = useFoundingStore((s) => s.auditionMethod);
  const extraBudget = useFoundingStore((s) => s.auditionExtraBudget);
  const headcount = useFoundingStore((s) => s.auditionHeadcount);
  const candidates = useFoundingStore((s) => s.auditionCandidates);
  const executed = useFoundingStore((s) => s.auditionExecuted);
  const selectedIds = useFoundingStore((s) => s.selectedTraineeIds);

  const baseUnit =
    method === "scout"
      ? FOUNDING_RECRUITMENT_COSTS.scout
      : FOUNDING_RECRUITMENT_COSTS.openAudition;
  const headcountMult = RECRUITMENT_HEADCOUNT_MULTIPLIER[headcount];
  const baseCost = Math.round(baseUnit * headcountMult);
  const totalCost = baseCost + extraBudget;
  const methodBonus = method === "scout" ? 8 : 0;
  const statRange = getRecruitmentStatRange(extraBudget);
  const adjustedMin = Math.min(100, statRange.min + methodBonus);
  const adjustedMax = Math.min(100, statRange.max + methodBonus);
  const tierLabel = getRecruitmentBudgetLabel(extraBudget);
  const statBandLabel = getStatBandLabel(adjustedMin, adjustedMax);

  const handleExecute = () => {
    if (money < totalCost) return;
    financeVanillaStore.getState().subtractMoney(totalCost);
    const result = generateTraineeCandidates(
      extraBudget,
      { type: method === "scout" ? "scout" : "open" },
      groupGender,
      Date.now(),
      headcount,
    );
    foundingVanillaStore.getState().setAuditionCandidates(result);
    foundingVanillaStore.getState().setAuditionExecuted(true);
  };

  const handleNext = () => {
    const selected = candidates.filter((c) => selectedIds.includes(c.id));
    // 추가가 아닌 교체: "이전"으로 돌아와 선발을 바꿔도 복제·잔류 멤버가 생기지 않는다.
    traineeVanillaStore.setState({ trainees: selected }, false);
    const livingLevel = foundingVanillaStore.getState().facilitySelections.livingExpenseLevel;
    const perPerson = [500_000, 1_000_000, 1_500_000, 2_000_000][livingLevel - 1];
    financeVanillaStore.getState().updateFixedCosts({
      livingExpense: perPerson * selected.length,
    });
    onNext();
  };

  const store = foundingVanillaStore.getState();

  return (
    <>
      <div className="stagger-fade -mx-2 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-2 pb-3 pt-1">
        <FoundingTitleBar title="연습생 모집" />

        {!executed ? (
          <>
            <div className="space-y-2">
              <p className="text-sm text-slate-200">모집 방식</p>
              <div className="grid grid-cols-2 gap-3">
                {(["open", "scout"] as const).map((m) => (
                  <button
                    key={m}
                    className={[
                      "rounded-2xl border-2 p-3 text-center transition duration-150 ease-out active:scale-[0.96] [word-break:keep-all]",
                      radioTileClasses(method === m, true),
                    ].join(" ")}
                    onClick={() => store.setAuditionMethod(m)}
                  >
                    <p className="text-sm text-slate-50">
                      {m === "open" ? "공개 오디션" : "스카우트"}
                    </p>
                    <MoneyDisplay
                      amount={
                        m === "open"
                          ? FOUNDING_RECRUITMENT_COSTS.openAudition
                          : FOUNDING_RECRUITMENT_COSTS.scout
                      }
                      size="sm"
                      className="mt-1"
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                      {m === "open"
                        ? "능력치 분포 넓음"
                        : "능력치 +8 보장"}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <Card className="space-y-3">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm text-slate-200">
                  추가 예산{" "}
                  <span className="text-brand-cyan">+{formatKRW(extraBudget)}</span>
                </p>
                <p className="text-xs text-brand-cyan">
                  {tierLabel} 풀 · 능력치 {statBandLabel}
                </p>
              </div>
              <input
                type="range"
                min={0}
                max={100_000_000}
                step={5_000_000}
                value={extraBudget}
                onChange={(e) => store.setAuditionExtraBudget(Number(e.target.value))}
                className="h-10 w-full cursor-pointer accent-brand-cyan"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>{formatKRW(0)}</span>
                <span>{formatKRW(50_000_000)}</span>
                <span>{formatKRW(100_000_000)}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                예산을 늘릴수록 능력치 상·하한이 점진 상승합니다.
                {method === "scout" && " 스카우트는 +8 보너스."}
              </p>
            </Card>

            <div className="space-y-2">
              <p className="text-sm text-slate-200">모집 인원</p>
              <div className="flex gap-2">
                {HEADCOUNTS.map((n) => {
                  const cost = Math.round(
                    baseUnit * RECRUITMENT_HEADCOUNT_MULTIPLIER[n],
                  );
                  return (
                    <button
                      key={n}
                      className={[
                        "flex flex-1 flex-col items-center gap-0.5 rounded-2xl border-2 py-2 text-sm transition duration-150 ease-out active:scale-[0.96]",
                        headcount === n ? "text-brand-cyan" : "text-slate-400",
                        radioTileClasses(headcount === n, true),
                      ].join(" ")}
                      onClick={() => store.setAuditionHeadcount(n)}
                    >
                      <span>{n}명</span>
                      <span className="text-[11px] text-slate-400">
                        {formatKRW(cost)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Card className="flex items-center justify-between text-sm">
              <span className="text-slate-300">총 비용</span>
              <span className={money < totalCost ? "text-red-300" : "text-brand-cyan"}>
                {formatKRW(totalCost)}
                {money < totalCost && (
                  <span className="ml-2 text-xs text-red-400">잔액 부족</span>
                )}
              </span>
            </Card>
          </>
        ) : (
          <>
            <Card className="space-y-1 text-center text-sm text-slate-300">
              <p>
                선발: <span className="text-brand-cyan">{selectedIds.length}명</span> / 최소 {MIN_SELECT_COUNT}명
              </p>
              <p className="text-[11px] text-slate-400">
                필수 포지션 4개(리더·메인보컬·메인댄서·센터)는 겸직할 수 없어 최소 {MIN_SELECT_COUNT}명이 필요합니다.
              </p>
            </Card>

            <div className="space-y-3">
              {candidates.map((trainee) => (
                <TraineeCandidateCard
                  key={trainee.id}
                  trainee={trainee}
                  selected={selectedIds.includes(trainee.id)}
                  onToggle={(id) => store.toggleTraineeSelection(id)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 pb-2 pt-2">
        <Button tone="ghost" onClick={onPrev}>
          이전
        </Button>
        {executed ? (
          <Button
            disabled={selectedIds.length < MIN_SELECT_COUNT}
            onClick={handleNext}
          >
            다음 단계
          </Button>
        ) : (
          <Button disabled={money < totalCost} onClick={handleExecute}>
            오디션 실행 ({formatKRW(totalCost)})
          </Button>
        )}
      </div>
    </>
  );
}
