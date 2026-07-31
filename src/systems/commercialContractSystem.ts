import { COMMERCIAL_CONTRACTS } from "@/data/balance";
import type {
  ActiveCommercialContract,
  CommercialContractOffer,
} from "@/types/game";

export function normalizeCommercialContract<T extends CommercialContractOffer>(
  contract: T,
): T {
  return {
    ...contract,
    scheduleSlots:
      Number.isFinite(contract.scheduleSlots) && contract.scheduleSlots > 0
        ? contract.scheduleSlots
        : COMMERCIAL_CONTRACTS.legacyDefaults.scheduleSlots,
    weeklyStress:
      Number.isFinite(contract.weeklyStress) && contract.weeklyStress >= 0
        ? contract.weeklyStress
        : COMMERCIAL_CONTRACTS.legacyDefaults.weeklyStress,
  };
}

export function getCommercialScheduleSlots(
  contracts: readonly ActiveCommercialContract[],
): number {
  return contracts.reduce(
    (sum, contract) => sum + normalizeCommercialContract(contract).scheduleSlots,
    0,
  );
}

export function canSignCommercialContract(
  activeContracts: readonly ActiveCommercialContract[],
  rawOffer: CommercialContractOffer,
): { allowed: boolean; reason: string | null } {
  const offer = normalizeCommercialContract(rawOffer);
  const conflictsWithExclusive = activeContracts.some((contract) =>
    offer.kind === "brand-exclusive"
      ? contract.kind === "brand-exclusive" || contract.kind === "ambassador"
      : offer.kind === "ambassador" && contract.kind === "brand-exclusive",
  );
  if (conflictsWithExclusive) {
    return {
      allowed: false,
      reason: "진행 중인 브랜드 독점 조건과 겹쳐 이 계약을 받을 수 없습니다",
    };
  }
  if (
    getCommercialScheduleSlots(activeContracts) + offer.scheduleSlots >
    COMMERCIAL_CONTRACTS.maxScheduleSlots
  ) {
    return {
      allowed: false,
      reason: `외부 계약 일정은 최대 ${COMMERCIAL_CONTRACTS.maxScheduleSlots}칸까지 맡을 수 있습니다`,
    };
  }

  return { allowed: true, reason: null };
}
