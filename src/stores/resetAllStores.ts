import { albumVanillaStore, initialAlbumState } from "@/stores/albumStore";
import { calendarVanillaStore, initialCalendarState } from "@/stores/calendarStore";
import { competitorVanillaStore, initialCompetitorState } from "@/stores/competitorStore";
import { eventVanillaStore, initialEventState } from "@/stores/eventStore";
import { fandomVanillaStore, initialFandomState } from "@/stores/fandomStore";
import { financeVanillaStore, initialFinanceState } from "@/stores/financeStore";
import { foundingVanillaStore } from "@/stores/foundingStore";
import { gameVanillaStore, initialGameState } from "@/stores/gameStore";
import { staffVanillaStore, initialStaffState } from "@/stores/staffStore";
import { traineeVanillaStore, initialTraineeState } from "@/stores/traineeStore";

/**
 * 새 게임 시작 시 모든 게임 스토어를 초기 상태로 되돌린다.
 * 세이브 대상 9개 스토어 전부 + 창단 플로우 스토어까지 리셋해야
 * 이전 판의 팬덤/앨범/라이벌/일정/이벤트가 새 게임으로 누출되지 않는다.
 */
export function resetAllStores() {
  gameVanillaStore.setState(structuredClone(initialGameState), false);
  financeVanillaStore.setState(structuredClone(initialFinanceState), false);
  staffVanillaStore.setState(structuredClone(initialStaffState), false);
  traineeVanillaStore.setState(structuredClone(initialTraineeState), false);
  fandomVanillaStore.setState(structuredClone(initialFandomState), false);
  albumVanillaStore.setState(structuredClone(initialAlbumState), false);
  competitorVanillaStore.setState(structuredClone(initialCompetitorState), false);
  calendarVanillaStore.setState(structuredClone(initialCalendarState), false);
  eventVanillaStore.setState(structuredClone(initialEventState), false);
  foundingVanillaStore.getState().resetFoundingStore();
}
