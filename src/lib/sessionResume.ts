/**
 * 새로고침 복원 포인터. 진행 중인 세이브 슬롯만 localStorage에 남기고,
 * 실제 게임 상태는 항상 Supabase 세이브에서 다시 불러온다.
 */
const STORAGE_KEY = "idolverse.activeSession.v1";

interface ActiveSessionPointer {
  userId: string;
  slotNumber: number;
}

function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function rememberActiveSession(userId: string, slotNumber: number) {
  const storage = safeStorage();
  if (!storage) return;
  try {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ userId, slotNumber } satisfies ActiveSessionPointer),
    );
  } catch {
    // 저장 공간 부족 등은 복원 기능만 포기하면 된다.
  }
}

/** 현재 로그인한 사용자의 복원 슬롯. 다른 계정의 포인터는 무시한다. */
export function readActiveSession(userId: string): number | null {
  const storage = safeStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ActiveSessionPointer>;
    if (
      parsed.userId !== userId ||
      typeof parsed.slotNumber !== "number" ||
      !Number.isInteger(parsed.slotNumber)
    ) {
      return null;
    }
    return parsed.slotNumber;
  } catch {
    return null;
  }
}

export function clearActiveSession() {
  const storage = safeStorage();
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // 제거 실패는 무시한다.
  }
}
