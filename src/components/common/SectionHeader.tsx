interface SectionHeaderProps {
  /** 상단 작은 카테고리 라벨 */
  eyebrow?: string;
  title: string;
  description?: string;
}

/**
 * 게임 셸 탭 화면 공용 헤더. 창단 플로우의 FoundingTitleBar에 대응하는
 * 인게임 버전으로, 탭 화면들은 전부 이 헤더로 시작한다.
 */
export function SectionHeader({ eyebrow, title, description }: SectionHeaderProps) {
  return (
    <header className="mb-4">
      {eyebrow ? (
        <p className="text-xs font-semibold text-action-secondary">{eyebrow}</p>
      ) : null}
      <h1
        className={[
          "text-xl font-semibold text-text-primary",
          eyebrow ? "mt-1" : "",
        ].join(" ")}
      >
        {title}
      </h1>
      {description ? (
        <p className="mt-1 text-sm text-text-muted [word-break:keep-all]">
          {description}
        </p>
      ) : null}
    </header>
  );
}
