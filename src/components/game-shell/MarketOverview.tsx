import { Globe2, Heart, RadioTower, UsersRound } from "lucide-react";
import { useCalendarStore } from "@/stores/calendarStore";
import { useFandomStore } from "@/stores/fandomStore";

const METRICS = [
  { key: "public", label: "대중 인지도", icon: RadioTower },
  { key: "fandom", label: "코어 팬덤", icon: Heart },
  { key: "global", label: "해외 팬덤", icon: Globe2 },
  { key: "industry", label: "업계 평판", icon: UsersRound },
] as const;

export function MarketOverview() {
  const publicRecognition = useFandomStore((state) => state.public);
  const coreFandom = useFandomStore((state) => state.fandom);
  const globalFandom = useFandomStore((state) => state.global);
  const industryReputation = useFandomStore((state) => state.industry);
  const news = useCalendarStore((state) => state.kpopNews);
  const fandom = {
    public: publicRecognition,
    fandom: coreFandom,
    global: globalFandom,
    industry: industryReputation,
  };

  return (
    <section className="h-full overflow-y-auto p-4">
      <header className="mb-4">
        <p className="text-xs font-semibold text-action-secondary">MARKET</p>
        <h1 className="mt-1 text-xl font-semibold text-text-primary">시장 브리핑</h1>
        <p className="mt-1 text-sm text-text-muted">팬덤 4축과 최근 업계 변화를 봅니다.</p>
      </header>
      <dl className="grid grid-cols-2 gap-2.5">
        {METRICS.map((metric) => {
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
      <section className="mt-4 rounded-3xl bg-surface-panel p-4 shadow-[var(--shadow-surface)]">
        <h2 className="text-sm font-semibold text-text-primary">최근 뉴스</h2>
        <ul className="mt-3 divide-y divide-white/8">
          {news.slice(0, 4).map((item) => (
            <li key={item.id} className="py-3 first:pt-0 last:pb-0">
              <p className="text-sm text-text-secondary">{item.headline}</p>
              <p className="mt-1 text-xs tabular-nums text-text-muted">W{item.week}</p>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
