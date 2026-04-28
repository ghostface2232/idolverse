import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { MoneyDisplay } from "@/components/common/MoneyDisplay";
import { PixelText } from "@/components/common/PixelText";
import { FacilityTierSelector } from "@/components/founding/FacilityTierSelector";
import { FOUNDING_FACILITY_TIERS, FOUNDING_ONETIME_UPGRADES } from "@/data/founding";
import { financeVanillaStore, useFinanceStore } from "@/stores/financeStore";
import { useFoundingStore, foundingVanillaStore } from "@/stores/foundingStore";

interface FacilityInvestmentProps {
  onNext: () => void;
  onPrev: () => void;
}

export function FacilityInvestment({ onNext, onPrev }: FacilityInvestmentProps) {
  const money = useFinanceStore((s) => s.money);
  const sel = useFoundingStore((s) => s.facilitySelections);

  const update = foundingVanillaStore.getState().updateFacilitySelection;

  const dormTier = FOUNDING_FACILITY_TIERS.dormitory[sel.dormLevel - 1];
  const studioTier = FOUNDING_FACILITY_TIERS.studio[sel.studioLevel - 1];
  const equipTier = FOUNDING_FACILITY_TIERS.equipment[sel.equipmentLevel - 1];
  const livingTier = FOUNDING_FACILITY_TIERS.livingExpense[sel.livingExpenseLevel - 1];

  const monthlyTotal =
    dormTier.monthlyCost +
    studioTier.monthlyCost +
    equipTier.monthlyCost +
    livingTier.perPersonCost * 5;

  const onetimeTotal =
    (sel.hasHealthcare ? FOUNDING_ONETIME_UPGRADES.healthcare.cost : 0) +
    (sel.hasSecurity ? FOUNDING_ONETIME_UPGRADES.security.cost : 0);

  const handleConfirm = () => {
    financeVanillaStore.getState().updateFixedCosts({
      dormitory: dormTier.monthlyCost,
      studio: studioTier.monthlyCost,
      equipment: equipTier.monthlyCost,
      livingExpense: livingTier.perPersonCost * 5,
    });

    const state = financeVanillaStore.getState();
    const upgrades = { ...state.upgrades };

    if (sel.hasHealthcare && !upgrades.hasHealthcare) {
      financeVanillaStore.getState().subtractMoney(FOUNDING_ONETIME_UPGRADES.healthcare.cost);
      financeVanillaStore.getState().updateFixedCosts({ healthcare: 700_000 });
      upgrades.hasHealthcare = true;
    }
    if (sel.hasSecurity && !upgrades.hasSecurity) {
      financeVanillaStore.getState().subtractMoney(FOUNDING_ONETIME_UPGRADES.security.cost);
      financeVanillaStore.getState().updateFixedCosts({ security: 600_000 });
      upgrades.hasSecurity = true;
    }

    upgrades.dormLevel = sel.dormLevel;
    upgrades.studioLevel = sel.studioLevel;
    upgrades.equipmentLevel = sel.equipmentLevel;

    financeVanillaStore.setState({ upgrades }, false);
    onNext();
  };

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-2">
        <PixelText as="h2" className="pt-2 text-2xl text-brand-cyan">
          시설 투자
        </PixelText>

        <FacilityTierSelector
          category="숙소"
          tiers={FOUNDING_FACILITY_TIERS.dormitory}
          selectedLevel={sel.dormLevel}
          onSelect={(l) => update({ dormLevel: l as 1 | 2 | 3 | 4 })}
        />
        <FacilityTierSelector
          category="연습실"
          tiers={FOUNDING_FACILITY_TIERS.studio}
          selectedLevel={sel.studioLevel}
          onSelect={(l) => update({ studioLevel: l as 1 | 2 | 3 | 4 })}
        />
        <FacilityTierSelector
          category="장비"
          tiers={FOUNDING_FACILITY_TIERS.equipment}
          selectedLevel={sel.equipmentLevel}
          onSelect={(l) => update({ equipmentLevel: l as 1 | 2 | 3 | 4 })}
        />
        <FacilityTierSelector
          category="생활비 (1인당)"
          tiers={FOUNDING_FACILITY_TIERS.livingExpense}
          selectedLevel={sel.livingExpenseLevel}
          onSelect={(l) => update({ livingExpenseLevel: l as 1 | 2 | 3 | 4 })}
        />

        <Card className="space-y-3">
          <p className="text-sm text-slate-200">선택적 업그레이드 (일시 비용)</p>
          {(["healthcare", "security"] as const).map((key) => {
            const item = FOUNDING_ONETIME_UPGRADES[key];
            const checked = key === "healthcare" ? sel.hasHealthcare : sel.hasSecurity;

            return (
              <label
                key={key}
                className="flex items-start gap-3 rounded-xl border border-slate-600 bg-slate-800/60 p-3"
              >
                <input
                  type="checkbox"
                  className="mt-1 accent-brand-cyan"
                  checked={checked}
                  onChange={(e) =>
                    update(
                      key === "healthcare"
                        ? { hasHealthcare: e.target.checked }
                        : { hasSecurity: e.target.checked },
                    )
                  }
                />
                <div className="flex-1 [word-break:keep-all] [overflow-wrap:break-word]">
                  <p className="text-sm text-slate-50">
                    {item.name}{" "}
                    <span className="text-xs text-emerald-300">
                      ₩{(item.cost / 10000).toLocaleString()}만
                    </span>
                  </p>
                  <p className="text-xs text-slate-400">{item.description}</p>
                </div>
              </label>
            );
          })}
        </Card>

        <Card className="space-y-2 text-center">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">월 고정비 (5인 기준)</span>
            <MoneyDisplay amount={monthlyTotal} size="sm" />
          </div>
          {onetimeTotal > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">일시 투자</span>
              <span className="text-sm text-red-300">
                ₩{new Intl.NumberFormat("ko-KR").format(onetimeTotal)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-slate-600 pt-2">
            <span className="text-xs text-slate-400">잔액</span>
            <MoneyDisplay amount={money - onetimeTotal} size="sm" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 pb-2 pt-2">
        <Button tone="ghost" onClick={onPrev}>
          이전
        </Button>
        <Button onClick={handleConfirm}>시설 확정</Button>
      </div>
    </>
  );
}
