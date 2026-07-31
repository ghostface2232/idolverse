import { useStaffStore } from "@/stores/staffStore";

export interface ManagerPersona {
  name: string;
  roleLabel: string;
  profileImagePath?: string;
  profileSpriteIndex?: number;
}

const FALLBACK_PERSONA: ManagerPersona = {
  name: "매니저",
  roleLabel: "총괄 매니저",
  profileImagePath: "/staff/manager-profiles-spritesheet.png",
  profileSpriteIndex: 0,
};

/**
 * 브리핑·리포트에서 말하는 매니저의 얼굴과 이름.
 * 고용된 매니저가 있으면 그 사람을, 없으면 기본 페르소나를 쓴다.
 */
export function useManagerPersona(): ManagerPersona {
  const manager = useStaffStore((state) =>
    state.staff.find((member) => member.role === "manager"),
  );

  if (!manager) return FALLBACK_PERSONA;

  return {
    name: manager.name,
    roleLabel: "매니저",
    profileImagePath: manager.profileImagePath ?? FALLBACK_PERSONA.profileImagePath,
    profileSpriteIndex:
      manager.profileSpriteIndex ?? FALLBACK_PERSONA.profileSpriteIndex,
  };
}
