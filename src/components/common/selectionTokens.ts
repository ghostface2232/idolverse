/**
 * 선택 상태 디자인 토큰 — 모든 선택형 타일은 이 두 함수만 사용한다.
 * - 라디오(하나만 선택): 시안 강조. 그룹에 선택이 있으면 나머지 항목은 dim.
 * - 체크(복수 선택): 에메랄드 강조. 비선택 항목은 dim하지 않는다(선택 가능 암시).
 * 하이라이트는 ring으로만 낸다(호출부의 shadow 유틸리티와 합성 가능해야 한다).
 */
export function radioTileClasses(
  selected: boolean,
  groupHasSelection: boolean,
): string {
  if (selected) {
    return "border-brand-cyan bg-brand-cyan/[0.08] ring-[3px] ring-brand-cyan/20";
  }
  return [
    "border-white/12 bg-surface-shell/60 hover:border-brand-cyan/40",
    groupHasSelection ? "opacity-85 hover:opacity-100" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function checkTileClasses(selected: boolean): string {
  return selected
    ? "border-emerald-400 bg-emerald-400/[0.08] ring-[3px] ring-emerald-400/20"
    : "border-white/12 bg-surface-shell/60 hover:border-emerald-400/40";
}
