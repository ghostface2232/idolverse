import { MoneyDisplay } from "@/components/common/MoneyDisplay";

interface Tier {
  level: number;
  name: string;
  monthlyCost?: number;
  perPersonCost?: number;
  effect: string;
}

interface FacilityTierSelectorProps {
  category: string;
  tiers: readonly Tier[];
  selectedLevel: number;
  onSelect: (level: number) => void;
}

export function FacilityTierSelector({
  category,
  tiers,
  selectedLevel,
  onSelect,
}: FacilityTierSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-200">{category}</p>
      <div className="grid grid-cols-2 gap-2">
        {tiers.map((tier) => {
          const isSelected = tier.level === selectedLevel;
          const cost = tier.monthlyCost ?? tier.perPersonCost ?? 0;

          return (
            <button
              key={tier.level}
              type="button"
              className={[
                "rounded-2xl border-2 p-3 text-left transition [word-break:keep-all] [overflow-wrap:break-word]",
                isSelected
                  ? "border-brand-cyan bg-cyan-500/10"
                  : "border-slate-600 bg-slate-800/60 hover:border-brand-cyan/50",
              ].join(" ")}
              onClick={() => onSelect(tier.level)}
            >
              <p className="text-sm text-slate-50">{tier.name}</p>
              <MoneyDisplay amount={cost} size="sm" className="mt-1" />
              {tier.perPersonCost !== undefined && (
                <span className="text-[10px] text-slate-500"> /인</span>
              )}
              <p className="mt-1 text-[10px] text-slate-400">{tier.effect}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
