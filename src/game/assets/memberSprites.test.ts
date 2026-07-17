import { describe, expect, it } from "vitest";
import {
  MEMBER_OUTFITS,
  MEMBER_SPRITE_FRAME,
  memberOutfitForActivity,
  memberSpriteKey,
  memberSpriteFrameForId,
} from "@/game/assets/memberSprites";

describe("memberSpriteFrameForId", () => {
  it("keeps the same trainee on a stable frame", () => {
    expect(memberSpriteFrameForId("trainee-harin")).toBe(
      memberSpriteFrameForId("trainee-harin"),
    );
  });

  it("always returns a valid sprite-sheet frame", () => {
    for (let index = 0; index < 100; index += 1) {
      const frame = memberSpriteFrameForId(`trainee-${index}`);
      expect(frame).toBeGreaterThanOrEqual(0);
      expect(frame).toBeLessThan(MEMBER_SPRITE_FRAME.count);
    }
  });
});

describe("member outfit composition", () => {
  it("keeps appearance frames independent from outfit selection", () => {
    const frame = memberSpriteFrameForId("trainee-harin");

    MEMBER_OUTFITS.forEach((outfit) => {
      expect(memberSpriteFrameForId("trainee-harin")).toBe(frame);
      expect(memberSpriteKey("female", outfit)).toContain(`-${outfit}-`);
    });
  });

  it("selects simulation outfits from the current activity", () => {
    expect(memberOutfitForActivity("training")).toBe("trainee");
    expect(memberOutfitForActivity("individual")).toBe("hoodie");
    expect(memberOutfitForActivity("rest")).toBe("denim");
    expect(memberOutfitForActivity("vacation")).toBe("airport");
    expect(memberOutfitForActivity("entertainment")).toBe("stage");
    expect(memberOutfitForActivity(null)).toBe("trainee");
  });
});
