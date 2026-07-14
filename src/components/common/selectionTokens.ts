/**
 * 선택 상태 디자인 토큰 — 모든 선택형 타일은 이 두 함수만 사용한다.
 * - 라디오(하나만 선택): 시안 강조. 그룹에 선택이 있으면 나머지 항목은 dim.
 * - 체크(복수 선택): 에메랄드 강조. 비선택 항목은 dim하지 않는다(선택 가능 암시).
 */
export function radioTileClasses(
  selected: boolean,
  groupHasSelection: boolean,
): string {
  if (selected) {
    return "border-brand-cyan bg-cyan-500/10 ring-2 ring-brand-cyan/40";
  }
  return [
    "border-slate-600 bg-slate-800/60 hover:border-brand-cyan/50",
    groupHasSelection ? "opacity-60 hover:opacity-100" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function checkTileClasses(selected: boolean): string {
  return selected
    ? "border-emerald-400 bg-emerald-500/10 ring-2 ring-emerald-400/40"
    : "border-slate-600 bg-slate-800/60 hover:border-emerald-400/50";
}
