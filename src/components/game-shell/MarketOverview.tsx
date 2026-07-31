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
import { GroupBadge } from "@/components/visual/GroupBadge";
import { SceneThumb } from "@/components/visual/SceneThumb";
import { CONCEPT_MOOD_DATA, GENRE_DATA } from "@/data/concepts";
import { NEWS_TYPE_LABELS } from "@/data/kpopCalendar";
import {
  getMarketStanding,
} from "@/data/marketStanding";
import type { SceneKey } from "@/data/sceneArt";
import { useCalendarStore } from "@/stores/calendarStore";
import { useCompetitorStore } from "@/stores/competitorStore";
import { useFandomStore } from "@/stores/fandomStore";
import { useGameStore } from "@/stores/gameStore";
import type { CompetitorType } from "@/types/game";

const FANDOM_METRICS = [
  {
    key: "public",
    label: "대중 인지도",
    icon: RadioTower,
    accent: "text-action-primary",
    fill: "bg-action-primary",
  },
  {
    key: "fandom",
    label: "코어 팬덤",
    icon: Heart,
    accent: "text-pink-300",
    fill: "bg-pink-400",
  },
  {
    key: "global",
    label: "해외 팬덤",
    icon: Globe2,
    accent: "text-action-secondary",
    fill: "bg-action-secondary",
  },
  {
    key: "industry",
    label: "업계 평판",
    icon: UsersRound,
    accent: "text-state-warning",
    fill: "bg-state-warning",
  },
] as const;

const COMPETITOR_TYPE_LABELS: Record<CompetitorType, string> = {
  traditional: "정통파",
  viral: "바이럴",
  performance: "퍼포먼스",
  global: "글로벌",
  survival: "서바이벌",
};

const CHART_LABELS = [
  { key: "melon", label: "멜론", dot: "bg-lime-400" },
  { key: "spotify", label: "Spotify", dot: "bg-emerald-400" },
  { key: "youtube", label: "YouTube", dot: "bg-red-400" },
  { key: "albumSales", label: "앨범 판매", dot: "bg-amber-400" },
] as const;

/** 헤드라인 키워드로 어울리는 씬 아트를 고른다. */
function sceneForHeadline(text: string): SceneKey {
  if (/컴백|데뷔|신곡|타이틀/.test(text)) return "comeback";
  if (/차트|1위|순위|스트리밍/.test(text)) return "chart";
  if (/시상|수상|어워드|대상|트로피/.test(text)) return "award";
  if (/해외|글로벌|월드|투어/.test(text)) return "global";
  return "news";
}

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
    <section className="h-full overflow-y-auto p-4 sm:p-5">
      <div className="mx-auto max-w-xl space-y-5">
        <SectionHeader
          title="시장"
        />

        <section aria-labelledby="fandom-heading">
          <h2 id="fandom-heading" className="sr-only">
            팬덤 현황
          </h2>
          <dl className="grid grid-cols-2 gap-2.5">
            {FANDOM_METRICS.map((metric) => {
              const Icon = metric.icon;
              const standing = getMarketStanding(
                metric.key,
                fandom[metric.key],
              );
              return (
                <div
                  key={metric.key}
                  className="rounded-2xl bg-surface-panel p-3 shadow-[var(--shadow-surface)]"
                >
                  <dt className="flex items-center gap-2 text-xs text-text-muted">
                    <Icon
                      className={["size-4", metric.accent].join(" ")}
                      aria-hidden="true"
                    />
                    {metric.label}
                  </dt>
                  <dd className="mt-2 text-base font-semibold leading-snug text-text-primary text-pretty">
                    {standing.label}
                  </dd>
                  <StandingScale
                    accentClass={metric.fill}
                    label={metric.label}
                    standing={standing}
                  />
                </div>
              );
            })}
          </dl>
        </section>

        <section aria-labelledby="trend-heading">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="size-4 text-action-secondary" aria-hidden="true" />
            <h2 id="trend-heading" className="text-sm font-semibold text-text-primary">
              지금 뜨는 컨셉
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl bg-action-primary/[0.09] p-4 shadow-[var(--shadow-surface)]">
              <div className="flex items-center gap-1.5 text-xs font-medium text-pink-200">
                <TrendingUp className="size-3.5" aria-hidden="true" />
                반응 상승
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-action-primary/20 px-2.5 py-1 text-xs font-semibold text-pink-100">
                  {GENRE_DATA[marketTrend.hotGenre].label}
                </span>
                <span className="rounded-full bg-action-primary/10 px-2.5 py-1 text-xs text-pink-200/90">
                  {CONCEPT_MOOD_DATA[marketTrend.hotMood].label} 무드
                </span>
              </div>
            </div>
            <div className="rounded-2xl bg-action-secondary/[0.07] p-4 shadow-[var(--shadow-surface)]">
              <div className="flex items-center gap-1.5 text-xs font-medium text-cyan-200/85">
                <TrendingDown className="size-3.5" aria-hidden="true" />
                열기 식는 중
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-action-secondary/16 px-2.5 py-1 text-xs font-semibold text-cyan-100/90">
                  {GENRE_DATA[marketTrend.coldGenre].label}
                </span>
                <span className="rounded-full bg-action-secondary/8 px-2.5 py-1 text-xs text-cyan-200/75">
                  {CONCEPT_MOOD_DATA[marketTrend.coldMood].label} 무드
                </span>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="charts-heading">
          <div className="mb-3 flex items-center gap-2">
            <RadioTower className="size-4 text-action-primary" aria-hidden="true" />
            <div>
              <h2 id="charts-heading" className="text-sm font-semibold text-text-primary">
                최신 차트 성적
              </h2>
              <p className="mt-0.5 text-xs text-text-muted">
                {groupName}의 현재 순위입니다.
              </p>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-2.5">
            {CHART_LABELS.map((chart) => {
              const rank = chartPositions[chart.key];
              return (
                <div
                  key={chart.key}
                  className="rounded-xl bg-surface-shell/68 p-3 shadow-[var(--shadow-surface)]"
                >
                  <dt className="flex items-center gap-1.5 text-xs text-text-muted">
                    <span
                      aria-hidden="true"
                      className={["size-1.5 rounded-full", chart.dot].join(" ")}
                    />
                    {chart.label}
                  </dt>
                  <dd className="mt-1.5">
                    {rank > 0 ? (
                      <>
                        <span className="text-2xl font-bold tabular-nums leading-none text-text-primary">
                          {rank}
                        </span>
                        <span className="ml-0.5 text-sm font-medium text-text-secondary">
                          위
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-medium text-text-muted">미진입</span>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>

          {chartLeaders.length > 0 ? (
            <div className="mt-3 rounded-2xl bg-surface-raised/52 px-4 py-3.5 shadow-[var(--shadow-surface)]">
              <div className="mb-2.5 flex items-center gap-2">
                <Trophy className="size-3.5 text-state-warning" aria-hidden="true" />
                <h3 className="text-xs font-semibold text-text-secondary">
                  지금 강한 팀
                </h3>
              </div>
              <ol className="space-y-2.5">
                {chartLeaders.map((group, index) => (
                  <li key={group.id} className="flex items-center gap-2.5 text-sm">
                    <span className="w-4 shrink-0 text-right text-xs font-semibold tabular-nums text-text-muted">
                      {index + 1}
                    </span>
                    <GroupBadge name={group.name} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-text-secondary">
                      {group.name}
                    </span>
                    <span className="shrink-0 rounded-full bg-white/[0.06] px-2 py-1 text-xs font-medium text-text-secondary">
                      {getMarketStanding("chartPower", group.chartScore).label}
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
                라이벌 동향
              </h2>
              <p className="mt-0.5 text-xs text-text-muted">
                국내 반응이 큰 순서입니다.
              </p>
            </div>
          </div>
          <div className="divide-y divide-white/8 rounded-2xl bg-surface-shell/68 px-4 shadow-[var(--shadow-surface)]">
            {rivals.map((rival) => {
              const comeback = upcomingComebacks.find(
                (item) => item.competitorId === rival.id,
              );
              const publicStanding = getMarketStanding(
                "public",
                rival.public,
              );
              const globalStanding = getMarketStanding(
                "global",
                rival.global / 50,
              );
              const industryStanding = getMarketStanding(
                "industry",
                rival.industry,
              );
              return (
                <article key={rival.id} className="py-4 first:pt-3.5 last:pb-3.5">
                  <div className="flex min-w-0 items-start gap-3">
                    <GroupBadge name={rival.name} size="md" className="mt-0.5" />
                    <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
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
                        <p className="text-xs text-text-muted">국내 반응</p>
                        <p className="mt-0.5 max-w-24 text-xs font-semibold leading-snug text-text-primary text-pretty">
                          {publicStanding.label}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 pl-[52px] text-xs text-text-secondary">
                    <span
                      className="inline-flex items-center gap-1"
                      aria-label={`해외 반응 ${globalStanding.label}`}
                    >
                      <Globe2
                        className="size-3 text-action-secondary"
                        aria-hidden="true"
                      />
                      {globalStanding.label}
                    </span>
                    <span
                      className="inline-flex items-center gap-1"
                      aria-label={`업계 평판 ${industryStanding.label}`}
                    >
                      <UsersRound
                        className="size-3 text-state-warning"
                        aria-hidden="true"
                      />
                      {industryStanding.label}
                    </span>
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
              업계 핫이슈
            </h2>
          </div>
          <ul className="divide-y divide-white/8 rounded-2xl bg-surface-shell/68 px-4 shadow-[var(--shadow-surface)]">
            {news.slice(0, 4).map((item) => (
              <li key={item.id} className="py-3.5 first:pt-3 last:pb-3">
                <div className="flex items-start gap-2.5">
                  <SceneThumb
                    scene={sceneForHeadline(item.headline)}
                    variant="chip"
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3 text-xs text-text-muted">
                      <span>{NEWS_TYPE_LABELS[item.type]}</span>
                      <span className="tabular-nums">{item.week}주차</span>
                    </div>
                    <p className="mt-1 text-sm font-medium leading-relaxed text-text-primary [word-break:keep-all]">
                      {item.headline}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-text-muted [word-break:keep-all]">
                      {item.detail}
                    </p>
                  </div>
                </div>
              </li>
            ))}
            {news.length === 0 ? (
              <li className="py-6 text-center text-sm text-text-muted">
                이번 주 업계 핫이슈가 없습니다.
              </li>
            ) : null}
          </ul>
        </section>
      </div>
    </section>
  );
}

function StandingScale({
  accentClass,
  label,
  standing,
}: {
  accentClass: string;
  label: string;
  standing: ReturnType<typeof getMarketStanding>;
}) {
  const completedTiers = standing.tierIndex + 1;
  const progress = Math.round((completedTiers / standing.tierCount) * 100);

  return (
    <div
      className="mt-3"
      role="progressbar"
      aria-label={`${label} 단계`}
      aria-valuemin={1}
      aria-valuemax={standing.tierCount}
      aria-valuenow={completedTiers}
      aria-valuetext={`${standing.label}, ${
        standing.nextLabel ? `다음 ${standing.nextLabel}` : "최고 단계"
      }`}
    >
      <div aria-hidden="true" className="flex gap-1">
        {Array.from({ length: standing.tierCount }, (_, index) => (
          <span
            key={index}
            className={[
              "h-1.5 min-w-0 flex-1 rounded-full",
              index <= standing.tierIndex
                ? accentClass
                : "bg-white/[0.08]",
            ].join(" ")}
          />
        ))}
      </div>
      <p className="mt-2 text-[11px] leading-4 text-text-muted text-pretty">
        {standing.nextLabel ? `다음 단계 · ${standing.nextLabel}` : "최고 단계"}
        <span className="sr-only">, 단계 진행 {progress}%</span>
      </p>
    </div>
  );
}
