import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { MoneyDisplay } from "@/components/common/MoneyDisplay";
import { PixelText } from "@/components/common/PixelText";
import { TraineeCandidateCard } from "@/components/founding/TraineeCandidateCard";
import { FOUNDING_RECRUITMENT_COSTS } from "@/data/founding";
import { generateTraineeCandidates } from "@/systems/recruitSystem";
import { financeVanillaStore, useFinanceStore } from "@/stores/financeStore";
import { traineeVanillaStore } from "@/stores/traineeStore";
import { useFoundingStore, foundingVanillaStore } from "@/stores/foundingStore";
import { useGameStore } from "@/stores/gameStore";

interface AuditionProps {
  onNext: () => void;
  onPrev: () => void;
}

const HEADCOUNTS = [3, 5, 7, 9] as const;

export function Audition({ onNext, onPrev }: AuditionProps) {
  const money = useFinanceStore((s) => s.money);
  const groupGender = useGameStore((s) => s.groupGender);

  const method = useFoundingStore((s) => s.auditionMethod);
  const extraBudget = useFoundingStore((s) => s.auditionExtraBudget);
  const headcount = useFoundingStore((s) => s.auditionHeadcount);
  const candidates = useFoundingStore((s) => s.auditionCandidates);
  const executed = useFoundingStore((s) => s.auditionExecuted);
  const selectedIds = useFoundingStore((s) => s.selectedTraineeIds);

  const baseCost =
    method === "scout"
      ? FOUNDING_RECRUITMENT_COSTS.scout
      : FOUNDING_RECRUITMENT_COSTS.openAudition;
  const totalCost = baseCost + extraBudget;

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
    for (const trainee of selected) {
      traineeVanillaStore.getState().addTrainee(trainee);
    }
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
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-2">
        <PixelText as="h2" className="pt-2 text-2xl text-brand-cyan">
          연습생 모집
        </PixelText>

        {!executed ? (
          <>
            <div className="space-y-2">
              <p className="text-sm text-slate-200">모집 방식</p>
              <div className="grid grid-cols-2 gap-3">
                {(["open", "scout"] as const).map((m) => (
                  <button
                    key={m}
                    className={[
                      "rounded-2xl border-2 p-3 text-center transition [word-break:keep-all]",
                      method === m
                        ? "border-brand-cyan bg-cyan-500/10"
                        : "border-slate-600 bg-slate-800/60",
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
                    <p className="mt-1 text-[10px] text-slate-400">
                      {m === "open" ? "능력치 분포 넓음" : "능력치 하한 보장"}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <Card className="space-y-2">
              <p className="text-sm text-slate-200">추가 예산</p>
              <input
                type="range"
                min={0}
                max={100_000_000}
                step={10_000_000}
                value={extraBudget}
                onChange={(e) => store.setAuditionExtraBudget(Number(e.target.value))}
                className="w-full accent-brand-cyan"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>₩0</span>
                <span className="text-slate-200">
                  +₩{(extraBudget / 10000).toLocaleString()}만
                </span>
                <span>₩1억</span>
              </div>
            </Card>

            <div className="space-y-2">
              <p className="text-sm text-slate-200">모집 인원</p>
              <div className="flex gap-2">
                {HEADCOUNTS.map((n) => (
                  <button
                    key={n}
                    className={[
                      "flex-1 rounded-xl border-2 py-2 text-sm transition",
                      headcount === n
                        ? "border-brand-cyan bg-cyan-500/10 text-brand-cyan"
                        : "border-slate-600 bg-slate-800/60 text-slate-400",
                    ].join(" ")}
                    onClick={() => store.setAuditionHeadcount(n)}
                  >
                    {n}명
                  </button>
                ))}
              </div>
              {headcount < 5 && (
                <p className="text-xs text-amber-300">포지션 커버를 위해 최소 5명을 권장합니다.</p>
              )}
            </div>

            <Button
              className="w-full"
              disabled={money < totalCost}
              onClick={handleExecute}
            >
              오디션 실행 (₩{(totalCost / 10000).toLocaleString()}만)
            </Button>
          </>
        ) : (
          <>
            <Card className="text-center text-sm text-slate-300">
              선발: <span className="text-brand-cyan">{selectedIds.length}명</span> / 최소 3명
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
          <Button disabled={selectedIds.length < 3} onClick={handleNext}>
            다음 단계
          </Button>
        ) : (
          <div />
        )}
      </div>
    </>
  );
}
