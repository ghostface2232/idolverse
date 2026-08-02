import { useEffect, useState } from "react";

interface NumberScrambleOptions {
  /** 연출 총 시간(ms). 갱신 간격이 점점 벌어지며 목표값에 안착한다. */
  durationMs: number;
  /** 목표값에서 벗어나는 최대 폭. 진행될수록 0으로 좁혀진다. */
  maxOffset: number;
  /** 표시값 하한(차트 1위 미만 방지 등). */
  min?: number;
  /** above면 목표보다 큰(나쁜) 쪽으로만 흔들린다 — 순위 카운트다운용. */
  direction?: "both" | "above";
  /** false면 즉시 목표값으로 고정한다(스킵·비활성). */
  active: boolean;
}

/**
 * 숫자가 빠르게 랜덤으로 바뀌다가 서서히 진짜 값에 안착하는 슬롯머신 연출.
 * 진행될수록 흔들림 폭이 좁아지고 갱신 간격이 길어져 긴장감이 목표값으로
 * 수렴한다. prefers-reduced-motion 환경에서는 즉시 목표값을 보여준다.
 */
export function useNumberScramble(
  target: number,
  {
    durationMs,
    maxOffset,
    min = 0,
    direction = "both",
    active,
  }: NumberScrambleOptions,
): { value: number; settled: boolean } {
  const [value, setValue] = useState(target);
  const [settled, setSettled] = useState(!active);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!active || reduceMotion) {
      setValue(target);
      setSettled(true);
      return;
    }

    setSettled(false);
    const startedAt = performance.now();
    let timer = 0;
    const tick = () => {
      const progress = Math.min(
        1,
        (performance.now() - startedAt) / durationMs,
      );
      if (progress >= 1) {
        setValue(target);
        setSettled(true);
        return;
      }
      // easeOutCubic — 초반엔 넓고 빠르게, 후반엔 좁고 느리게.
      const eased = 1 - (1 - progress) ** 3;
      const spread = maxOffset * (1 - eased);
      const roll = direction === "above" ? Math.random() : Math.random() * 2 - 1;
      setValue(Math.max(min, Math.round(target + roll * spread)));
      timer = window.setTimeout(tick, 45 + eased * 240);
    };
    tick();
    return () => window.clearTimeout(timer);
  }, [target, durationMs, maxOffset, min, direction, active]);

  return { value, settled };
}
