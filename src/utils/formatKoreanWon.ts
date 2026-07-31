interface FormatKoreanWonOptions {
  /** 금액 칩처럼 통화 기호를 쓸 때 true. 예: ₩3500만 */
  symbol?: boolean;
}

/** 계산 결과의 100만 원 미만 자릿수를 반올림한다. */
export function roundToMillionWon(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount / 1_000_000) * 1_000_000;
}

/**
 * 원화 금액을 한국어 수 체계에 맞춰 표시한다.
 * 큰 금액은 100만 원 단위, 100만 원 미만은 1만 원 단위로 반올림해
 * 플레이 중 빠르게 읽을 수 있게 한다.
 * - 35,400,000 → 3500만 원
 * - 120,400,000 → 1억 2000만 원
 * - 824,000 → 82만 원
 */
export function formatKoreanWon(
  amount: number,
  { symbol = false }: FormatKoreanWonOptions = {},
): string {
  if (!Number.isFinite(amount)) return symbol ? "₩0" : "0원";

  const rounded = Math.round(amount);
  const sign = rounded < 0 ? "-" : "";
  const rawAbsolute = Math.abs(rounded);
  const absolute =
    rawAbsolute >= 1_000_000
      ? Math.abs(roundToMillionWon(rawAbsolute))
      : Math.round(rawAbsolute / 10_000) * 10_000;
  const eok = Math.floor(absolute / 100_000_000);
  const man = Math.floor((absolute % 100_000_000) / 10_000);
  const won = absolute % 10_000;
  const parts: string[] = [];

  if (eok > 0) parts.push(`${eok}억`);
  if (man > 0) parts.push(`${man}만`);

  if (won > 0 || parts.length === 0) {
    parts.push(`${won.toLocaleString("ko-KR")}${symbol ? "" : "원"}`);
  } else if (!symbol) {
    parts.push("원");
  }

  return `${sign}${symbol ? "₩" : ""}${parts.join(" ")}`;
}
