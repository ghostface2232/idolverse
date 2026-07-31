import {
  BadgeDollarSign,
  CalendarClock,
  Coins,
  Disc3,
  Handshake,
  Landmark,
  Radio,
  ReceiptText,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { AlbumArt } from "@/components/visual/AlbumArt";
import { GAME_BALANCE } from "@/data/balance";
import { useAlbumStore } from "@/stores/albumStore";
import { useFinanceStore } from "@/stores/financeStore";
import { useGameStore } from "@/stores/gameStore";
import {
  ALBUM_UNIT_MARGIN,
  calculateAlbumLifetimeRevenue,
  calculateAlbumRevenue,
} from "@/systems/economySystem";
import type { Album } from "@/types/game";
import { formatKoreanWon } from "@/utils/formatKoreanWon";

const INCOME_LABELS: Record<string, string> = {
  streaming: "음원 스트리밍",
  album: "음반 판매",
  promotions: "공연·프로모션",
  commercialContracts: "광고·외부 계약",
  strategicExpansion: "팬 사업·글로벌 사업",
  emergencyFinancing: "긴급 자금 조달",
  decisionSupport: "협상·지원금",
};

const EXPENSE_LABELS: Record<string, string> = {
  fixedCosts: "고정 운영비",
  promotions: "활동 비용",
  productionBudget: "앨범 제작비",
  staffDevelopment: "스태프 육성",
  facilityInvestment: "시설 투자",
  strategicExpansion: "사업 유지비",
  memberSettlement: "멤버 정산",
  financingRepayment: "자금 상환",
  decisionCosts: "이번 주 선택 비용",
};

const RECURRING_INCOME_KEYS = new Set([
  "streaming",
  "commercialContracts",
  "strategicExpansion",
]);

interface FinanceOverviewModalProps {
  onClose: () => void;
}

export function FinanceOverviewModal({ onClose }: FinanceOverviewModalProps) {
  const money = useFinanceStore((state) => state.money);
  const weeklyFixedTotal = useFinanceStore((state) => state.weeklyFixedTotal);
  const incomeHistory = useFinanceStore((state) => state.incomeHistory);
  const expenseHistory = useFinanceStore((state) => state.expenseHistory);
  const pendingExpenses = useFinanceStore((state) => state.pendingExpenses ?? {});
  const currentYear = useGameStore((state) => state.currentYear);
  const currentWeek = useGameStore((state) => state.currentWeek);
  const currentAlbum = useAlbumStore((state) => state.currentAlbum);
  const releasedAlbums = useAlbumStore((state) => state.releasedAlbums);

  const latestIncome = incomeHistory.at(-1)?.breakdown ?? {};
  const latestExpense = expenseHistory.at(-1)?.breakdown ?? {};
  const recurringIncome = Object.entries(latestIncome).reduce(
    (sum, [key, value]) => sum + (RECURRING_INCOME_KEYS.has(key) ? value : 0),
    0,
  );
  const weeklyBurn = Math.max(0, weeklyFixedTotal - recurringIncome);
  const runwayWeeks =
    weeklyBurn > 0 ? Math.max(0, Math.floor(money / weeklyBurn)) : null;
  const recentNet = buildRecentNet(incomeHistory, expenseHistory, 8);
  const averageNet =
    recentNet.length > 0
      ? Math.round(recentNet.reduce((sum, value) => sum + value, 0) / recentNet.length)
      : 0;
  const pendingTotal = sumValues(pendingExpenses);
  const cumulativeWeek = (currentYear - 1) * GAME_BALANCE.weeksPerYear + currentWeek;
  const latestAlbum = releasedAlbums.at(-1) ?? null;

  return (
    <Modal
      title="자금 흐름"
      onClose={onClose}
      className="sm:max-w-lg"
      footer={
        <Button className="w-full" onPress={onClose}>
          확인
        </Button>
      }
    >
      <div className="space-y-4 text-sm text-text-secondary">
        <section className="rounded-3xl bg-[linear-gradient(145deg,rgba(16,185,129,0.14),rgba(6,182,212,0.08))] p-4 shadow-[var(--shadow-surface)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-emerald-200">현재 보유 자금</p>
              <p className="mt-1 text-2xl font-bold tracking-[-0.03em] tabular-nums text-white">
                {formatWon(money)}
              </p>
            </div>
            <CashTrend value={averageNet} weeks={recentNet.length} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Metric
              label="반복 수입"
              value={`+${formatWon(recurringIncome)}`}
              tone="good"
            />
            <Metric
              label="주간 고정비"
              value={`-${formatWon(weeklyFixedTotal)}`}
              tone="bad"
            />
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-text-muted">
            <CalendarClock className="size-3.5" aria-hidden="true" />
            {runwayWeeks === null
              ? "반복 수입이 고정비를 감당하고 있습니다"
              : runwayWeeks > 52
                ? "현재 반복 수입 기준 1년 이상 운영할 수 있습니다"
                : `현재 반복 수입 기준 약 ${runwayWeeks}주 운영할 수 있습니다`}
          </p>
        </section>

        {pendingTotal > 0 ? (
          <section className="rounded-2xl bg-amber-400/[0.08] p-3 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.18)]">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-200">
                <ReceiptText className="size-3.5" aria-hidden="true" />
                이번 결산에 반영할 결제
              </p>
              <p className="font-semibold tabular-nums text-amber-100">
                -{formatWon(pendingTotal)}
              </p>
            </div>
            <Breakdown values={pendingExpenses} labels={EXPENSE_LABELS} />
          </section>
        ) : null}

        <section>
          <SectionTitle icon={Coins} title="지난주에 돈이 움직인 이유" />
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <FlowCard
              label="들어온 돈"
              total={sumValues(latestIncome)}
              values={latestIncome}
              labels={INCOME_LABELS}
              tone="good"
            />
            <FlowCard
              label="나간 돈"
              total={sumValues(latestExpense)}
              values={latestExpense}
              labels={EXPENSE_LABELS}
              tone="bad"
            />
          </div>
        </section>

        {latestAlbum?.performance ? (
          <AlbumPaybackCard album={latestAlbum} cumulativeWeek={cumulativeWeek} />
        ) : currentAlbum ? (
          <section className="rounded-2xl bg-surface-raised/65 p-3">
            <div className="flex items-center gap-3">
              <AlbumArt title={currentAlbum.title} size="md" />
              <div className="min-w-0">
                <p className="text-xs text-brand-pink">제작 중인 앨범</p>
                <p className="mt-0.5 truncate font-semibold text-text-primary">
                  {currentAlbum.title}
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  제작비 {formatWon(currentAlbum.productionCost ?? 0)}를 회수하려면
                  판매와 스트리밍 성과가 필요합니다.
                </p>
              </div>
            </div>
          </section>
        ) : null}

        <section>
          <SectionTitle icon={BadgeDollarSign} title="돈을 버는 다섯 가지 길" />
          <div className="mt-2 space-y-2">
            <IncomeRoute
              icon={Radio}
              title="음원 스트리밍"
              text="첫 앨범 발매 뒤 매주 들어옵니다. 코어 팬덤, 해외 팬덤, 차트 순위가 높을수록 늘어납니다."
            />
            <IncomeRoute
              icon={Disc3}
              title="음반 판매"
              text={`발매 후 5주 동안 정산됩니다. 초동 1장당 ${ALBUM_UNIT_MARGIN.toLocaleString("ko-KR")}원이 회사 수익으로 돌아옵니다.`}
            />
            <IncomeRoute
              icon={Landmark}
              title="공연·프로모션"
              text="활동기 일정에서 수익형 무대를 고르면 즉시 수입을 만들 수 있습니다. 비용과 멤버 컨디션을 함께 봐야 합니다."
            />
            <IncomeRoute
              icon={Handshake}
              title="광고·외부 계약"
              text="광고와 제휴 제안을 수락하면 계약 기간 동안 매주 정산됩니다."
            />
            <IncomeRoute
              icon={TrendingUp}
              title="팬 사업·글로벌 사업"
              text="회사가 성장한 뒤 사업 기반을 넓히면 팬덤 규모에 비례하는 반복 수입이 생깁니다."
            />
          </div>
        </section>
      </div>
    </Modal>
  );
}

function AlbumPaybackCard({
  album,
  cumulativeWeek,
}: {
  album: Album;
  cumulativeWeek: number;
}) {
  const sales = album.performance?.firstWeekSales ?? 0;
  const expectedRevenue = calculateAlbumLifetimeRevenue(sales);
  const weeksAfterRelease =
    album.releaseWeek == null ? 4 : Math.max(0, cumulativeWeek - album.releaseWeek);
  const receivedRevenue = Array.from(
    { length: Math.min(weeksAfterRelease, 4) + 1 },
    (_, week) => calculateAlbumRevenue(sales, week),
  ).reduce((sum, value) => sum + value, 0);
  const progress =
    expectedRevenue > 0 ? Math.min(100, (receivedRevenue / expectedRevenue) * 100) : 0;
  const productionCost = album.productionCost ?? null;
  const albumOnlyProfit =
    productionCost == null ? null : expectedRevenue - productionCost;

  return (
    <section className="rounded-3xl bg-surface-shell/70 p-4 shadow-[var(--shadow-surface)]">
      <div className="flex items-center gap-3">
        <AlbumArt title={album.title} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-brand-pink">최신 앨범 회수 현황</p>
          <p className="mt-0.5 truncate font-semibold text-text-primary">{album.title}</p>
          <p className="mt-1 text-xs tabular-nums text-text-muted">
            초동 {sales.toLocaleString("ko-KR")}장 × 장당 {ALBUM_UNIT_MARGIN.toLocaleString("ko-KR")}원
          </p>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-pink-500 to-cyan-400 transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 text-xs">
        <span className="text-text-muted">음반 정산 {Math.round(progress)}%</span>
        <span className="font-semibold tabular-nums text-emerald-200">
          {formatWon(receivedRevenue)} / {formatWon(expectedRevenue)}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Metric
          label="음반 예상 총수익"
          value={formatWon(expectedRevenue)}
          tone="good"
        />
        <Metric
          label="제작비 대비"
          value={
            albumOnlyProfit == null
              ? "기록 없음"
              : `${albumOnlyProfit >= 0 ? "+" : "-"}${formatWon(Math.abs(albumOnlyProfit))}`
          }
          tone={albumOnlyProfit != null && albumOnlyProfit >= 0 ? "good" : "bad"}
        />
      </div>
      <p className="mt-2 text-[11px] leading-4 text-text-muted">
        제작비 대비 값은 음반 정산만 계산합니다. 스트리밍, 공연, 광고 수익은 별도로
        들어옵니다.
      </p>
    </section>
  );
}

function CashTrend({ value, weeks }: { value: number; weeks: number }) {
  const positive = value >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <div
      className={[
        "shrink-0 rounded-2xl px-3 py-2 text-right",
        positive ? "bg-emerald-400/10" : "bg-rose-400/10",
      ].join(" ")}
    >
      <p className="flex items-center justify-end gap-1 text-[11px] text-text-muted">
        <Icon className="size-3.5" aria-hidden="true" />
        최근 {weeks || 0}주 평균
      </p>
      <p
        className={[
          "mt-0.5 text-sm font-semibold tabular-nums",
          positive ? "text-emerald-200" : "text-rose-200",
        ].join(" ")}
      >
        {positive ? "+" : "-"}
        {formatWon(Math.abs(value))}
      </p>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "bad";
}) {
  return (
    <div className="rounded-2xl bg-white/[0.055] px-3 py-2.5">
      <p className="text-[11px] text-text-muted">{label}</p>
      <p
        className={[
          "mt-1 truncate text-sm font-semibold tabular-nums",
          tone === "good" ? "text-emerald-200" : "text-rose-200",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

function FlowCard({
  label,
  total,
  values,
  labels,
  tone,
}: {
  label: string;
  total: number;
  values: Record<string, number>;
  labels: Record<string, string>;
  tone: "good" | "bad";
}) {
  return (
    <article className="rounded-2xl bg-surface-raised/65 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-text-muted">{label}</p>
        <p
          className={[
            "font-semibold tabular-nums",
            tone === "good" ? "text-emerald-200" : "text-rose-200",
          ].join(" ")}
        >
          {tone === "good" ? "+" : "-"}
          {formatWon(total)}
        </p>
      </div>
      <Breakdown values={values} labels={labels} />
    </article>
  );
}

function Breakdown({
  values,
  labels,
}: {
  values: Record<string, number>;
  labels: Record<string, string>;
}) {
  const entries = Object.entries(values).filter(([, value]) => value > 0);
  return entries.length > 0 ? (
    <ul className="mt-2 space-y-1.5 pt-2 shadow-[inset_0_1px_rgba(255,255,255,0.07)]">
      {entries.map(([key, value]) => (
        <li key={key} className="flex items-center justify-between gap-2 text-xs">
          <span className="text-text-muted">{labels[key] ?? key}</span>
          <span className="shrink-0 tabular-nums text-text-secondary">
            {formatWon(value)}
          </span>
        </li>
      ))}
    </ul>
  ) : (
    <p className="mt-2 text-xs text-text-muted">이번 주 내역이 없습니다</p>
  );
}

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: typeof Coins;
  title: string;
}) {
  return (
    <h2 className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.08em] text-cyan-200">
      <Icon className="size-3.5" aria-hidden="true" />
      {title}
    </h2>
  );
}

function IncomeRoute({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Coins;
  title: string;
  text: string;
}) {
  return (
    <article className="flex gap-3 rounded-2xl bg-surface-raised/55 p-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-cyan-400/10 text-cyan-200">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div>
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        <p className="mt-0.5 text-pretty text-xs leading-5 text-text-muted [word-break:keep-all]">
          {text}
        </p>
      </div>
    </article>
  );
}

function buildRecentNet(
  income: { breakdown: Record<string, number> }[],
  expense: { breakdown: Record<string, number> }[],
  maxWeeks: number,
) {
  const count = Math.min(income.length, expense.length, maxWeeks);
  return Array.from({ length: count }, (_, index) => {
    const incomeEntry = income[income.length - count + index];
    const expenseEntry = expense[expense.length - count + index];
    return sumValues(incomeEntry.breakdown) - sumValues(expenseEntry.breakdown);
  });
}

function sumValues(values: Record<string, number>) {
  return Object.values(values).reduce((sum, value) => sum + value, 0);
}

function formatWon(value: number) {
  return formatKoreanWon(value);
}
