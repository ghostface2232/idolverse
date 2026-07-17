import { describe, expect, it } from "vitest";
import { josa, withJosa } from "@/utils/josa";

describe("josa", () => {
  it("받침 있는 이름에는 이/은/을/과/으로를 붙인다", () => {
    expect(withJosa("지민", "이/가")).toBe("지민이");
    expect(withJosa("지민", "은/는")).toBe("지민은");
    expect(withJosa("지민", "을/를")).toBe("지민을");
    expect(withJosa("지민", "과/와")).toBe("지민과");
    expect(withJosa("지민", "으로/로")).toBe("지민으로");
  });

  it("받침 없는 이름에는 가/는/를/와/로를 붙인다", () => {
    expect(withJosa("하리", "이/가")).toBe("하리가");
    expect(withJosa("하리", "은/는")).toBe("하리는");
    expect(withJosa("하리", "을/를")).toBe("하리를");
    expect(withJosa("하리", "과/와")).toBe("하리와");
    expect(withJosa("하리", "으로/로")).toBe("하리로");
  });

  it("ㄹ 받침 뒤 으로/로 는 '로'를 쓴다", () => {
    expect(withJosa("서울", "으로/로")).toBe("서울로");
    expect(withJosa("서울", "이/가")).toBe("서울이");
  });

  it("숫자·영문으로 끝나면 발음 기준으로 판정한다", () => {
    expect(josa("멤버 3", "이/가")).toBe("이");
    expect(josa("멤버 2", "이/가")).toBe("가");
    expect(josa("IVE", "이/가")).toBe("가");
    expect(josa("SEVENTEEN", "이/가")).toBe("이");
    expect(josa("GIRL", "이/가")).toBe("이");
  });

  it("판정할 수 없으면 병기한다", () => {
    expect(josa("★", "이/가")).toBe("이(가)");
    expect(josa("", "을/를")).toBe("을(를)");
  });
});
