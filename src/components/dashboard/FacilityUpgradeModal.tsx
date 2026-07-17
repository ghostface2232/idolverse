import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { MoneyDisplay } from "@/components/common/MoneyDisplay";
import { FOUNDING_FACILITY_TIERS } from "@/data/founding";
import { UPGRADE_COSTS } from "@/stores/financeStore";
import type { FinanceStoreState } from "@/types/game";

type FacilityTarget = "dormLevel" | "studioLevel" | "equipmentLevel";

const FACILITY_ROWS: {
  target: FacilityTarget;
  label: string;
  tiers: readonly { level: number; name: string; effect: string }[];
}[] = [
  { target: "dormLevel", label: "숙소", tiers: FOUNDING_FACILITY_TIERS.dormitory },
  { target: "studioLevel", label: "연습실", tiers: FOUNDING_FACILITY_TIERS.studio },
  { target: "equipmentLevel", label: "장비", tiers: FOUNDING_FACILITY_TIERS.equipment },
];

interface FacilityUpgradeModalProps {
  upgrades: FinanceStoreState["upgrades"];
  money: number;
  isSaving: boolean;
  errorMessage?: string | null;
  onUpgrade: (target: FacilityTarget | "hasHealthcare" | "hasSecurity") => void | Promise<void>;
  onClose: () => void;
}

/** 창단 이후에도 회사는 자란다 — 시설 투자가 상시로 열린다 (M5). */
export function FacilityUpgradeModal({
  upgrades,
  money,
  isSaving,
  errorMessage,
  onUpgrade,
  onClose,
}: FacilityUpgradeModalProps) {
  return (
    <Modal title="시설 투자" onClose={onClose} isCloseDisabled={isSaving}>
      <div className="space-y-3 text-sm">
        {FACILITY_ROWS.map(({ target, label, tiers }) => {
          const level = upgrades[target];
          const current = tiers.find((tier) => tier.level === level);
          const next = tiers.find((tier) => tier.level === level + 1);
          const cost =
            level < 4
              ? UPGRADE_COSTS[target][level as 1 | 2 | 3]
              : 0;
          return (
            <section
              key={target}
              className="rounded-xl bg-surface-shell/72 p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-text-primary">
                  {label}{" "}
                  <span className="text-xs text-text-muted">
                    Lv.{level} {current?.name}
                  </span>
                </span>
                {next ? (
                  <Button
                    tone="secondary"
                    className="shrink-0 px-3 py-1.5 text-xs"
                    isDisabled={isSaving || money < cost}
                    onPress={() => void onUpgrade(target)}
                  >
                    Lv.{next.level} <MoneyDisplay amount={cost} size="sm" />
                  </Button>
                ) : (
                  <span className="text-xs text-emerald-300">최고 등급</span>
                )}
              </div>
              {next ? (
                <p className="mt-1.5 text-pretty text-xs leading-4 text-text-muted">
                  {next.name}: {next.effect}
                </p>
              ) : null}
            </section>
          );
        })}

        <section className="grid grid-cols-2 gap-2">
          {(
            [
              { target: "hasHealthcare" as const, label: "메디컬팀", owned: upgrades.hasHealthcare, cost: UPGRADE_COSTS.hasHealthcare },
              { target: "hasSecurity" as const, label: "보안팀", owned: upgrades.hasSecurity, cost: UPGRADE_COSTS.hasSecurity },
            ]
          ).map(({ target, label, owned, cost }) => (
            <div
              key={target}
              className="rounded-xl bg-surface-shell/72 p-3 text-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
            >
              <p className="text-sm font-semibold text-text-primary">{label}</p>
              {owned ? (
                <p className="mt-1 text-xs text-emerald-300">운영 중</p>
              ) : (
                <Button
                  tone="secondary"
                  className="mt-1.5 w-full px-3 py-1.5 text-xs"
                  isDisabled={isSaving || money < cost}
                  onPress={() => void onUpgrade(target)}
                >
                  도입 <MoneyDisplay amount={cost} size="sm" />
                </Button>
              )}
            </div>
          ))}
        </section>

        {errorMessage ? (
          <p role="alert" className="rounded-xl bg-state-danger/12 px-3 py-2 text-rose-200">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
