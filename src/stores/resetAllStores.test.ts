import { beforeEach, describe, expect, it } from "vitest";
import { albumVanillaStore, initialAlbumState } from "@/stores/albumStore";
import { calendarVanillaStore } from "@/stores/calendarStore";
import { competitorVanillaStore } from "@/stores/competitorStore";
import { eventVanillaStore } from "@/stores/eventStore";
import { fandomVanillaStore } from "@/stores/fandomStore";
import { financeVanillaStore } from "@/stores/financeStore";
import { foundingVanillaStore } from "@/stores/foundingStore";
import { gameVanillaStore } from "@/stores/gameStore";
import { resetAllStores } from "@/stores/resetAllStores";
import { staffVanillaStore } from "@/stores/staffStore";
import { traineeVanillaStore } from "@/stores/traineeStore";
import { initializePermanentRivals } from "@/systems/competitorSystem";
import { makeTrainee } from "@/test/gameStateFixture";

describe("resetAllStores", () => {
  beforeEach(() => {
    resetAllStores();
  });

  it("이전 판 상태가 리뷰 §3-5의 누출 스토어 5종에 남지 않는다", () => {
    // 이전 판을 재현: 팬덤/앨범/라이벌/일정/이벤트를 오염시킨다.
    fandomVanillaStore.setState({ fandom: 12_000, public: 88, global: 900 }, false);
    albumVanillaStore.setState(
      { currentAlbum: null, releasedAlbums: [initialAlbumState.currentAlbum!] },
      false,
    );
    competitorVanillaStore.setState({ permanentRivals: [], eventRivals: [] }, false);
    calendarVanillaStore.setState(
      {
        currentSeason: "winter",
        upcomingCompetitorComebacks: [
          { week: 40, competitorId: "stale", competitorName: "이전판라이벌" },
        ],
      },
      false,
    );
    eventVanillaStore.setState({ pendingEvents: [] }, false);
    gameVanillaStore.setState({ currentWeek: 44, currentYear: 3 }, false);
    financeVanillaStore.setState({ money: -500_000_000 }, false);
    staffVanillaStore.setState(
      { staff: [{ id: "s1" } as never] },
      false,
    );
    traineeVanillaStore.setState({ trainees: [makeTrainee("old")] }, false);
    foundingVanillaStore.setState({ auditionExecuted: true }, false);

    resetAllStores();

    expect(fandomVanillaStore.getState().fandom).toBe(0);
    expect(fandomVanillaStore.getState().public).toBe(5);
    expect(albumVanillaStore.getState().releasedAlbums).toEqual([]);
    expect(competitorVanillaStore.getState().permanentRivals.length).toBeGreaterThan(0);
    expect(calendarVanillaStore.getState().currentSeason).toBe("spring");
    expect(calendarVanillaStore.getState().upcomingCompetitorComebacks).toEqual([]);
    expect(eventVanillaStore.getState().pendingEvents.length).toBeGreaterThan(0);
    expect(gameVanillaStore.getState().currentWeek).toBe(1);
    expect(gameVanillaStore.getState().currentYear).toBe(1);
    expect(financeVanillaStore.getState().money).toBe(0);
    expect(staffVanillaStore.getState().staff).toEqual([]);
    expect(traineeVanillaStore.getState().trainees).toEqual([]);
    expect(foundingVanillaStore.getState().auditionExecuted).toBe(false);
  });

  it("리셋 후 상태를 변경해도 다음 리셋 결과가 오염되지 않는다 (초기 상태 참조 공유 방지)", () => {
    gameVanillaStore.getState().addNotification({
      type: "info",
      title: "테스트",
      message: "누적 알림",
      week: 2,
    });
    fandomVanillaStore.getState().updateCharts({ melon: 1 });

    resetAllStores();

    expect(
      gameVanillaStore.getState().notifications.map((n) => n.id),
    ).toEqual(["noti-welcome"]);
    expect(fandomVanillaStore.getState().chartPositions.melon).toBe(0);
  });
});

describe("traineeStore.addTrainee dedupe", () => {
  beforeEach(() => {
    resetAllStores();
  });

  it("같은 id를 두 번 추가해도 멤버가 복제되지 않는다", () => {
    const trainee = makeTrainee("dup");
    traineeVanillaStore.getState().addTrainee(trainee);
    traineeVanillaStore.getState().addTrainee({ ...trainee, name: "갱신된 이름" });

    const trainees = traineeVanillaStore.getState().trainees;
    expect(trainees).toHaveLength(1);
    expect(trainees[0].name).toBe("갱신된 이름");
  });
});

describe("initializePermanentRivals", () => {
  it("플레이어 그룹 성별과 같은 성별의 라이벌을 생성한다", () => {
    for (const gender of ["male", "female"] as const) {
      const { rivals, backgroundGroups } = initializePermanentRivals(0, gender, 1234);

      expect(rivals.length).toBeGreaterThanOrEqual(3);
      for (const rival of rivals) {
        expect(rival.gender).toBe(gender);
      }
      // 배경 그룹은 반대 성별 시장을 채운다.
      for (const bg of backgroundGroups) {
        expect(bg.gender).toBe(gender === "female" ? "male" : "female");
      }
    }
  });

  it("같은 시드는 같은 라이벌을, 다른 시드는 다른 구성을 만든다", () => {
    const a = initializePermanentRivals(0, "female", 42);
    const b = initializePermanentRivals(0, "female", 42);
    const c = initializePermanentRivals(0, "female", 43);

    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });
});
