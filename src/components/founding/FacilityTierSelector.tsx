import { MoneyDisplay } from "@/components/common/MoneyDisplay";
import { radioTileClasses } from "@/components/common/selectionTokens";
import { assetUrl } from "@/utils/assets";

interface Tier {
  level: number;
  name: string;
  monthlyCost?: number;
  perPersonCost?: number;
  effect: string;
  illustrationImagePath?: string;
  illustrationSpriteIndex?: number;
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
          const hasIllustration =
            tier.illustrationImagePath !== undefined &&
            tier.illustrationSpriteIndex !== undefined;

          return (
            <button
              key={tier.level}
              type="button"
              className={[
                "rounded-2xl border-2 p-3 text-left transition duration-150 ease-out active:scale-[0.96] [word-break:keep-all] [overflow-wrap:break-word]",
                radioTileClasses(isSelected, true),
              ].join(" ")}
              onClick={() => onSelect(tier.level)}
            >
              {hasIllustration && (
                <div
                  aria-hidden="true"
                  className={[
                    "mb-2 aspect-square w-full rounded border bg-slate-950",
                    isSelected ? "border-brand-cyan/70" : "border-slate-700",
                    "facility-option-sprite",
                    `facility-option-sprite-${tier.illustrationSpriteIndex ?? 0}`,
                  ].join(" ")}
                  style={{
                    backgroundImage: `url(${assetUrl(tier.illustrationImagePath ?? "")})`,
                  }}
                />
              )}
              <p className="text-sm text-slate-50">{tier.name}</p>
              <div className="mt-1 flex items-baseline gap-1">
                <MoneyDisplay amount={cost} size="sm" />
                {tier.perPersonCost !== undefined && (
                  <span className="text-[11px] text-slate-400">/인</span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">{tier.effect}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
