import { describe, expect, it } from "vitest";
import {
  deriveConceptAffinity,
  traitComboBonus,
} from "@/data/memberTraits";
import { calculateAlbumQuality } from "@/systems/albumSystem";
import { makeTrainee } from "@/test/gameStateFixture";
import type { Album } from "@/types/game";

describe("멤버 특성 → 컨셉 친화", () => {
  it("도도×고양이상은 섹시 컨셉에 강하고 청량에는 어색하다", () => {
    const affinity = deriveConceptAffinity(["haughty", "catlike"]);
    expect(affinity.sexy).toBeGreaterThan(70);
    expect(affinity.refreshing).toBeLessThan(45);
    // 성격과 인상이 모두 지지하는 컨셉은 조합 보너스를 받는다.
    expect(traitComboBonus(["haughty", "catlike"], "sexy")).toBeGreaterThan(0);
    expect(traitComboBonus(["haughty", "catlike"], "refreshing")).toBe(0);
  });

  it("순수×강아지상은 청량 컨셉의 얼굴이 된다", () => {
    const affinity = deriveConceptAffinity(["pure", "doglike"]);
    expect(affinity.refreshing).toBeGreaterThan(75);
    expect(affinity.sexy).toBeLessThan(35);
  });
});

describe("앨범별 센터", () => {
  function makeAlbum(centerTraineeId: string | null): Album {
    return {
      id: "a",
      title: "t",
      concept: { genre: "rnb", mood: "sexy" },
      titleTrackCandidates: [],
      titleTrack: {
        id: "tt",
        name: "곡",
        type: "safe",
        quality: 60,
        description: "",
      },
      centerTraineeId,
      progress: { song: 80, visual: 80, choreography: 80, marketing: 80 },
      memberConceptFit: 50,
      seasonFit: 50,
      fandomExpectationFit: 50,
      externalCollaborators: {},
      quality: 0,
    };
  }

  it("컨셉과 어울리는 센터가 앨범 완성도를 끌어올린다", () => {
    const chic = makeTrainee("chic", {
      traits: ["haughty", "catlike"],
      conceptAffinity: deriveConceptAffinity(["haughty", "catlike"]),
    });
    const innocent = makeTrainee("innocent", {
      traits: ["pure", "doglike"],
      conceptAffinity: deriveConceptAffinity(["pure", "doglike"]),
    });
    const trainees = [chic, innocent];
    const base = {
      trainees,
      teamChemistry: 20,
      season: "fall" as const,
      conceptHistory: [],
      equipmentLevel: 2 as const,
    };

    const withMatchedCenter = calculateAlbumQuality({
      ...base,
      album: makeAlbum("chic"),
    });
    const withMismatchedCenter = calculateAlbumQuality({
      ...base,
      album: makeAlbum("innocent"),
    });

    // 섹시 컨셉: 도도×고양이상 센터 > 순수×강아지상 센터.
    expect(withMatchedCenter).toBeGreaterThan(withMismatchedCenter);
  });
});
