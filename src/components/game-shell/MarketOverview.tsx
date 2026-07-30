import {
  CalendarClock,
  Globe2,
  Heart,
  Newspaper,
  RadioTower,
  TrendingDown,
  TrendingUp,
  Trophy,
  UsersRound,
} from "lucide-react";
import { SectionHeader } from "@/components/common/SectionHeader";
import { CONCEPT_MOOD_DATA, GENRE_DATA } from "@/data/concepts";
import { NEWS_TYPE_LABELS } from "@/data/kpopCalendar";
import { useCalendarStore } from "@/stores/calendarStore";
import { useCompetitorStore } from "@/stores/competitorStore";
import { useFandomStore } from "@/stores/fandomStore";
import { useGameStore } from "@/stores/gameStore";
import type { CompetitorType } from "@/types/game";

const FANDOM_METRICS = [
  { key: "public", label: "대중 인지도", icon: RadioTower },
  { key: "fandom", label: "코어 팬덤", icon: Heart },
  { key: "global", label: "해외 팬덤", icon: Globe2 },
  { key: "industry", label: "업계 평판", icon: UsersRound },
] as const;

const COMPETITOR_TYPE_LABELS: Record<CompetitorType, string> = {
  traditional: "정통파",
  viral: "바이럴",
  performance: "퍼포먼스",
  global: "글로벌",
  survival: "서바이벌",
};

const CHART_LABELS = [
  { key: "melon", label: "멜론" },
  { key: "spotify", label: "Spotify" },
  { key: "youtube", label: "YouTube" },
  { key: "albumSales", label: "앨범 판매" },
] as const;

/**
 * 시장 탭 화면. 기존에 탭(요약)과 모달(상세)로 나뉘어 있던 시장 정보를
 * 이 한 화면으로 합쳤다.
 */
export function MarketOverview() {
  const publicRecognition = useFandomStore((state) => state.public);
  const coreFandom = useFandomStore((state) => state.fandom);
  const globalFandom = useFandomStore((state) => state.global);
  const industryReputation = useFandomStore((state) => state.industry);
  const chartPositions = useFandomStore((state) => state.chartPositions);
  const news = useCalendarStore((state) => state.kpopNews);
  const marketTrend = useCalendarStore((state) => state.marketTrend);
  const upcomingComebacks = useCalendarStore(
    (state) => state.upcomingCompetitorComebacks,
  );
  const permanentRivals = useCompetitorStore((state) => state.permanentRivals);
  const eventRivals = useCompetitorStore((state) => state.eventRivals);
  const backgroundGroups = useCompetitorStore((state) => state.backgroundGroups);
  const groupName = useGameStore((state) => state.groupName);

  const fandom = {
    public: publicRecognition,
    fandom: coreFandom,
    global: globalFandom,
    industry: industryReputation,
  };
  const rivals = [...permanentRivals, ...eventRivals].sort(
    (left, right) => right.public - left.public,
  );
  const chartLeaders = [...backgroundGroups]
    .sort((left, right) => right.chartScore - left.chartScore)
    .slice(0, 4);

  return (
    <section className="h-full overflow-y-auto p-4">
      <div className="mx-auto max-w-xl space-y-5">
        <SectionHeader
          eyebrow="시장"
          title="시장 브리핑"
          description="팬덤, 트렌드, 경쟁 그룹, 차트를 한눈에 봅니다."
        />

        <section aria-labelledby="fandom-heading">
          <h2 id="fandom-heading" className="sr-only">
            팬덤 현황
          </h2>
          <dl className="grid grid-cols-2 gap-2.5">
            {FANDOM_METRICS.map((metric) => {
              const Icon = metric.icon;
              return (
                <div
                  key={metric.key}
                  className="rounded-2xl bg-surface-panel p-3 shadow-[var(--shadow-surface)]"
                >
                  <dt className="flex items-center gap-2 text-xs text-text-muted">
                    <Icon className="size-4 text-action-secondary" aria-hidden="true" />
                    {metric.label}
                  </dt>
                  <dd className="mt-2 text-lg font-semibold tabular-nums text-text-primary">
                    {fandom[metric.key].toLocaleString("ko-KR")}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>

        <section aria-labelledby="trend-heading">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="size-4 text-action-secondary" aria-hidden="true" />
            <h2 id="trend-heading" className="text-sm font-semibold text-text-primary">
              이번 시즌 트렌드
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-action-secondary/[0.075] p-4 shadow-[var(--shadow-surface)]">
              <div className="flex items-center gap-1.5 text-xs font-medium text-cyan-200">
                <TrendingUp className="size-3.5" aria-hidden="true" />
                수요 상승
              </div>
              <p className="mt-3 text-base font-semibold text-text-primary">
                {GENRE_DATA[marketTrend.hotGenre].label}
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                {CONCEPT_MOOD_DATA[marketTrend.hotMood].label} 무드
              </p>
            </div>
            <div className="rounded-2xl bg-surface-shell/68 p-4 shadow-[var(--shadow-surface)]">
              <div className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
                <TrendingDown className="size-3.5" aria-hidden="true" />
                수요 둔화
              </div>
              <p className="mt-3 text-base font-semibold text-text-primary">
                {GENRE_DATA[marketTrend.coldGenre].label}
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                {CONCEPT_MOOD_DATA[marketTrend.coldMood].label} 무드
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="charts-heading">
          <div className="mb-3 flex items-center gap-2">
            <RadioTower className="size-4 text-action-primary" aria-hidden="true" />
            <div>
              <h2 id="charts-heading" className="text-sm font-semibold text-text-primary">
                현재 주요 차트
              </h2>
              <p className="mt-0.5 text-xs text-text-muted">
                {groupName}의 최신 기록입니다.
              </p>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-2.5">
            {CHART_LABELS.map((chart, index) => {
              const rank = chartPositions[chart.key];
              return (
                <div
                  key={chart.key}
                  className={[
                    "rounded-xl p-3 shadow-[var(--shadow-surface)]",
                    index === 0 ? "bg-action-primary/[0.07]" : "bg-surface-shell/68",
                  ].join(" ")}
                >
                  <dt className="text-xs text-text-muted">{chart.label}</dt>
                  <dd className="mt-1.5 text-base font-semibold tabular-nums text-text-primary">
                    {rank > 0 ? `${rank}위` : "미진입"}
                  </dd>
                </div>
              );
            })}
          </dl>

          {chartLeaders.length > 0 ? (
            <div className="mt-3 rounded-2xl bg-surface-raised/52 px-4 py-3.5 shadow-[var(--shadow-surface)]">
              <div className="mb-2.5 flex items-center gap-2">
                <Trophy className="size-3.5 text-state-warning" aria-hidden="true" />
                <h3 className="text-xs font-semibold text-text-secondary">시장 상위권</h3>
              </div>
              <ol className="space-y-2.5">
                {chartLeaders.map((group, index) => (
                  <li key={group.id} className="flex items-center gap-3 text-sm">
                    <span className="w-4 shrink-0 text-right text-xs font-semibold tabular-nums text-text-muted">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-text-secondary">
                      {group.name}
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-text-muted">
                      지수 {Math.round(group.chartScore)}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </section>

        <section aria-labelledby="rivals-heading">
          <div className="mb-3 flex items-center gap-2">
            <UsersRound className="size-4 text-text-secondary" aria-hidden="true" />
            <div>
              <h2 id="rivals-heading" className="text-sm font-semibold text-text-primary">
                경쟁 그룹 상황
              </h2>
              <p className="mt-0.5 text-xs text-text-muted">
                대중 인지도가 높은 순서입니다.
              </p>
            </div>
          </div>
          <div className="divide-y divide-white/8 rounded-2xl bg-surface-shell/68 px-4 shadow-[var(--shadow-surface)]">
            {rivals.map((rival) => {
              const comeback = upcomingComebacks.find(
                (item) => item.competitorId === rival.id,
              );
              return (
                <article key={rival.id} className="py-4 first:pt-3.5 last:pb-3.5">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <h3 className="truncate text-[15px] font-semibold text-text-primary">
                          {rival.name}
                        </h3>
                        <span className="shrink-0 text-xs text-text-muted">
                          {COMPETITOR_TYPE_LABELS[rival.type]}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-text-muted">
                        {rival.agency} · 강점 {rival.strengths[0] ?? "분석 중"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-text-muted">대중 인지도</p>
                      <p className="mt-0.5 font-semibold tabular-nums text-text-primary">
                        {Math.round(rival.public)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
                    <span className="tabular-nums">
                      해외 {Math.round(rival.global).toLocaleString("ko-KR")}
                    </span>
                    <span className="tabular-nums">업계 {Math.round(rival.industry)}</span>
                    <span className="inline-flex items-center gap-1 text-text-muted">
                      <CalendarClock className="size-3" aria-hidden="true" />
                      {comeback
                        ? `${comeback.week}주차 컴백 예정`
                        : rival.currentAlbum
                          ? `${rival.currentAlbum.title} 활동 중`
                          : `활동 ${rival.activeWeeks}주차`}
                    </span>
                  </div>
                </article>
              );
            })}
            {rivals.length === 0 ? (
              <p className="py-6 text-center text-sm text-text-muted">
                현재 추적 중인 경쟁 그룹이 없습니다.
              </p>
            ) : null}
          </div>
        </section>

        <section aria-labelledby="market-news-heading" className="pb-2">
          <div className="mb-3 flex items-center gap-2">
            <Newspaper className="size-4 text-text-secondary" aria-hidden="true" />
            <h2
              id="market-news-heading"
              className="text-sm font-semibold text-text-primary"
            >
              주요 업계 소식
            </h2>
          </div>
          <ul className="divide-y divide-white/8 rounded-2xl bg-surface-shell/68 px-4 shadow-[var(--shadow-surface)]">
            {news.slice(0, 4).map((item) => (
              <li key={item.id} className="py-3.5 first:pt-3 last:pb-3">
                <div className="flex items-center justify-between gap-3 text-xs text-text-muted">
                  <span>{NEWS_TYPE_LABELS[item.type]}</span>
                  <span className="tabular-nums">{item.week}주차</span>
                </div>
                <p className="mt-1.5 text-sm font-medium leading-relaxed text-text-primary [word-break:keep-all]">
                  {item.headline}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-text-muted [word-break:keep-all]">
                  {item.detail}
                </p>
              </li>
            ))}
            {news.length === 0 ? (
              <li className="py-6 text-center text-sm text-text-muted">
                이번 주 주요 업계 소식이 없습니다.
              </li>
            ) : null}
          </ul>
        </section>
      </div>
    </section>
  );
}
