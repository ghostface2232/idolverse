import type { ReactNode } from "react";
import { HeartPulse, Sparkles, TriangleAlert } from "lucide-react";
import { Alert } from "@/components/common/Alert";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { useFinanceStore } from "@/stores/financeStore";
import type {
  ComebackSettlementReport,
  WeekDelta,
  WeeklyReportSnapshot,
} from "@/types/game";
import { withJosa } from "@/utils/josa";

interface WeekReportProps {
  report: WeeklyReportSnapshot;
  isSaving?: boolean;
  errorMessage?: string | null;
  onClose: () => void | Promise<void>;
}

export function WeekReport({
  report,
  isSaving = false,
  errorMessage,
  onClose,
}: WeekReportProps) {
  const money = useFinanceStore((state) => state.money);
  const incomeHistory = useFinanceStore((state) => state.incomeHistory);
  const expenseHistory = useFinanceStore((state) => state.expenseHistory);

  const deltas = report.deltas ?? [];
  const incomeTotal = sumValues(report.finance.income);
  const expenseTotal = sumValues(report.finance.expenses);
  const net = incomeTotal - expenseTotal;

  // 구조화 변화 로그에서 핵심 숫자를 뽑는다. 문장 나열 대신 숫자로 말한다.
  const fandomChange = sumNumericDeltas(
    deltas,
    (delta) => delta.target.kind === "fandom" && delta.target.field === "fandom",
  );
  const statGrowth = sumNumericDeltas(
    deltas,
    (delta) =>
      delta.target.kind === "trainee" && delta.target.field.startsWith("stats."),
  );
  const statChips = aggregateDeltaChips(
    deltas,
    (delta) =>
      delta.target.kind === "trainee" && delta.target.field.startsWith("stats."),
  );
  const fandomChips = aggregateDeltaChips(
    deltas,
    (delta) => delta.target.kind === "fandom",
  );

  // 헤드라인 우선순위: 컴백 정산 > 경고 첫 건 > 부상 첫 건.
  // 헤드라인으로 올린 항목은 아래 상세 카드에서 뺀다.
  const headlineWarning = report.comebackSettlement
    ? null
    : (report.warnings[0] ?? null);
  const remainingWarnings = headlineWarning
    ? report.warnings.slice(1)
    : report.warnings;
  const headlineInjury =
    report.comebackSettlement || headlineWarning
      ? null
      : (report.injuries[0] ?? null);
  const remainingInjuries = headlineInjury
    ? report.injuries.slice(1)
    : report.injuries;

  const netHistory = buildNetHistory(incomeHistory, expenseHistory, 12);

  const detailCards: { title: string; node: ReactNode }[] = [];

  if (statChips.length > 0) {
    detailCards.push({
      title: "멤버 성장",
      node: <DeltaChipList chips={statChips} />,
    });
  } else if (report.statChanges.length > 0) {
    // 구버전 리포트에는 deltas가 비어 있다. 문장 기록으로 대신 보여준다.
    detailCards.push({
      title: "멤버 성장",
      node: <BulletList items={report.statChanges} />,
    });
  }

  if (fandomChips.length > 0) {
    detailCards.push({
      title: "팬덤 반응",
      node: <DeltaChipList chips={fandomChips} />,
    });
  }

  if (remainingInjuries.length > 0) {
    detailCards.push({
      title: "부상 발생",
      node: (
        <BulletList
          items={remainingInjuries.map(
            (injury) => `${withJosa(injury.traineeName, "이/가")} 부상을 입었습니다.`,
          )}
        />
      ),
    });
  }

  if (report.conflicts.length > 0) {
    detailCards.push({
      title: "멤버 관계",
      node: (
        <BulletList
          items={report.conflicts.map(
            (conflict) =>
              `${withJosa(conflict.a, "과/와")} ${conflict.b} 사이의 갈등이${
                conflict.resolved ? " 풀렸습니다." : " 불거졌습니다."
              }`,
          )}
        />
      ),
    });
  }

  if (report.events.length > 0) {
    detailCards.push({
      title: "이번 주 주요 소식",
      node: <BulletList items={report.events.map((event) => event.title)} />,
    });
  }

  if (report.news.length > 0) {
    detailCards.push({
      title: "K-POP 뉴스",
      node: <BulletList items={report.news.map((news) => news.headline)} />,
    });
  }

  if (report.competitorComebacks.length > 0) {
    detailCards.push({
      title: "경쟁 그룹 동향",
      node: (
        <BulletList
          items={report.competitorComebacks.map(
            (comeback) => `${withJosa(comeback, "이/가")} 컴백 활동을 시작했습니다.`,
          )}
        />
      ),
    });
  }

  if (remainingWarnings.length > 0) {
    detailCards.push({
      title: "확인할 문제",
      node: <BulletList items={remainingWarnings} />,
    });
  }

  const isQuietWeek =
    detailCards.length === 0 &&
    !report.comebackSettlement &&
    !headlineWarning &&
    !headlineInjury;

  return (
    <Modal
      title={`${report.week}주차 결산`}
      onClose={onClose}
      isCloseDisabled={isSaving}
      footer={
        <Button className="w-full" isDisabled={isSaving} onPress={onClose}>
          {isSaving ? "저장 중…" : "결산 확인"}
        </Button>
      }
    >
      <div className="space-y-4 text-sm text-text-secondary">
        {errorMessage ? <Alert message={errorMessage} /> : null}

        {report.comebackSettlement ? (
          <ComebackSettlementSection settlement={report.comebackSettlement} />
        ) : null}

        {headlineWarning ? (
          <HeadlineBanner tone="warning" text={headlineWarning} />
        ) : null}

        {headlineInjury ? (
          <HeadlineBanner
            tone="danger"
            text={`${withJosa(headlineInjury.traineeName, "이/가")} 부상을 입었습니다. 이번 주 일정 조정이 필요합니다.`}
          />
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <StatTile
            label="순수익"
            value={`${net >= 0 ? "+" : "-"}${formatMoney(Math.abs(net))}원`}
            tone={net >= 0 ? "good" : "bad"}
          />
          <StatTile
            label="회사 잔액"
            value={`${money < 0 ? "-" : ""}${formatMoney(Math.abs(money))}원`}
            tone={money < 0 ? "bad" : "neutral"}
          />
          <StatTile
            label="코어 팬덤"
            value={formatDelta(fandomChange)}
            tone={deltaTone(fandomChange)}
          />
          <StatTile
            label="멤버 성장 합계"
            value={formatDelta(statGrowth)}
            tone={deltaTone(statGrowth)}
          />
        </div>

        {isQuietWeek ? (
          <p className="rounded-2xl bg-surface-shell/60 p-4 text-center text-text-muted">
            조용한 한 주였습니다.
          </p>
        ) : (
          detailCards.map((card) => (
            <ReportCard key={card.title} title={card.title}>
              {card.node}
            </ReportCard>
          ))
        )}

        <FinanceSection finance={report.finance} netHistory={netHistory} />
      </div>
    </Modal>
  );
}

/** 이번 주 최대 사건 1건. 큰 글씨와 아이콘으로 최상단에 못 박는다. */
function HeadlineBanner({
  tone,
  text,
}: {
  tone: "warning" | "danger";
  text: string;
}) {
  const toneClasses =
    tone === "warning"
      ? "border-state-warning/40 bg-state-warning/10"
      : "border-state-danger/40 bg-state-danger/10";
  const accent = tone === "warning" ? "text-state-warning" : "text-state-danger";
  const Icon = tone === "warning" ? TriangleAlert : HeartPulse;

  return (
    <section className={`rounded-2xl border p-4 ${toneClasses}`}>
      <p className={`text-[11px] uppercase tracking-[0.2em] ${accent}`}>
        이번 주 헤드라인
      </p>
      <p className="mt-2 flex items-start gap-2 text-base font-semibold leading-6 text-text-primary [word-break:keep-all]">
        <Icon className={`mt-0.5 size-5 shrink-0 ${accent}`} aria-hidden="true" />
        {text}
      </p>
    </section>
  );
}

/** 핵심 숫자 타일. 라벨은 작게, 숫자는 크게. */
function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "bad" | "neutral";
}) {
  const valueColor =
    tone === "good"
      ? "text-state-success"
      : tone === "bad"
        ? "text-state-danger"
        : "text-text-primary";

  return (
    <div className="rounded-xl bg-surface-raised/70 p-3">
      <p className="text-[11px] text-text-muted [word-break:keep-all]">{label}</p>
      <p className={`mt-1 text-lg font-semibold tabular-nums ${valueColor}`}>
        {value}
      </p>
    </div>
  );
}

/** 컴백 정산 주에만 등장하는 격상 섹션. 성과 정리와 다음 사이클 훅을 함께 낸다. */
function ComebackSettlementSection({
  settlement,
}: {
  settlement: ComebackSettlementReport;
}) {
  return (
    <section className="rounded-2xl bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.14),transparent_55%)] bg-surface-shell/70 p-3 shadow-[inset_0_0_0_1px_rgba(236,72,153,0.25)]">
      <h3 className="flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-brand-pink">
        <Sparkles className="size-3.5" aria-hidden="true" />
        컴백 정산: {settlement.albumTitle}
      </h3>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <SettlementStat label="차트 최고" value={`${settlement.chartPeak}위`} />
        <SettlementStat
          label="음악방송"
          value={
            settlement.musicShowWins === null
              ? "후보권 밖"
              : settlement.musicShowWins > 0
                ? `1위 ${settlement.musicShowWins}회`
                : "1위 불발"
          }
        />
        <SettlementStat
          label="초동 판매"
          value={`${formatCompact(settlement.firstWeekSales)}장`}
        />
        <SettlementStat
          label="누적 스트리밍"
          value={formatCompact(settlement.totalStreams)}
        />
      </div>
      {settlement.fanGrowth > 0 ? (
        <p className="mt-2 text-xs text-state-success">
          이번 활동으로 팬덤이 {Math.round(settlement.fanGrowth)}만큼 늘었습니다.
        </p>
      ) : null}
      {settlement.investorNotes.length > 0 ? (
        <ul className="mt-3 space-y-1 text-xs text-text-muted [word-break:keep-all]">
          {settlement.investorNotes.map((note) => (
            <li key={note}>투자사 {note}</li>
          ))}
        </ul>
      ) : null}
      <p className="mt-3 rounded-xl bg-surface-raised/60 px-3 py-2 text-pretty text-xs leading-5 text-text-secondary [word-break:keep-all]">
        {settlement.nextHook}
      </p>
    </section>
  );
}

function SettlementStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-raised/70 p-3">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-text-primary">
        {value}
      </p>
    </div>
  );
}

function ReportCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-surface-shell/60 p-3">
      <h3 className="text-xs uppercase tracking-[0.2em] text-brand-cyan">
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm [word-break:keep-all]">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

// ── 구조화 변화 칩 ──────────────────────────────────────────────

interface DeltaChip {
  key: string;
  label: string;
  field: string;
  value: number;
}

/** 증가가 오히려 나쁜 지표. 색을 뒤집는다. */
const BAD_WHEN_UP_FIELDS = new Set(["fandomDisappointment"]);

function DeltaChipList({ chips }: { chips: DeltaChip[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {chips.map((chip) => {
        const isGood = BAD_WHEN_UP_FIELDS.has(chip.field)
          ? chip.value < 0
          : chip.value > 0;

        return (
          <li
            key={chip.key}
            className="flex items-center gap-1.5 rounded-full bg-surface-raised/80 px-2.5 py-1 text-xs"
          >
            <span className="text-text-secondary [word-break:keep-all]">
              {chip.label}
            </span>
            <span
              className={`font-semibold tabular-nums ${
                isGood ? "text-state-success" : "text-state-danger"
              }`}
            >
              {formatDelta(chip.value)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** 같은 대상·항목의 하루치 변화를 주 단위로 합산해 칩 데이터로 만든다. */
function aggregateDeltaChips(
  deltas: WeekDelta[],
  match: (delta: WeekDelta) => boolean,
): DeltaChip[] {
  const map = new Map<string, DeltaChip>();

  for (const delta of deltas) {
    if (!match(delta)) continue;
    if (typeof delta.before !== "number" || typeof delta.after !== "number") {
      continue;
    }

    const key = `${delta.target.kind}:${delta.target.id ?? ""}:${delta.target.field}`;
    const diff = delta.after - delta.before;
    const existing = map.get(key);
    if (existing) {
      existing.value += diff;
    } else {
      map.set(key, {
        key,
        label: delta.target.label,
        field: delta.target.field,
        value: diff,
      });
    }
  }

  return [...map.values()]
    .filter((chip) => Math.abs(chip.value) >= 0.05)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
}

function sumNumericDeltas(
  deltas: WeekDelta[],
  match: (delta: WeekDelta) => boolean,
): number {
  return deltas.reduce((sum, delta) => {
    if (!match(delta)) return sum;
    if (typeof delta.before !== "number" || typeof delta.after !== "number") {
      return sum;
    }
    return sum + (delta.after - delta.before);
  }, 0);
}

// ── 재정 요약 ──────────────────────────────────────────────────

const FINANCE_INCOME_LABELS: Record<string, string> = {
  streaming: "음원 스트리밍",
  album: "음반 판매",
  promotions: "프로모션 활동",
  strategicExpansion: "전략 확장 수익",
  emergencyFinancing: "긴급 자금 조달",
  decisionSupport: "주간 결정 지원",
};

const FINANCE_EXPENSE_LABELS: Record<string, string> = {
  fixedCosts: "고정 운영비",
  promotions: "프로모션 비용",
  strategicExpansion: "전략 확장 유지비",
  financingRepayment: "차입금 상환",
  decisionCosts: "주간 결정 비용",
};

function FinanceSection({
  finance,
  netHistory,
}: {
  finance: WeeklyReportSnapshot["finance"];
  netHistory: number[];
}) {
  const incomeEntries = nonZeroEntries(finance.income);
  const expenseEntries = nonZeroEntries(finance.expenses);
  const incomeTotal = sumValues(finance.income);
  const expenseTotal = sumValues(finance.expenses);
  const net = incomeTotal - expenseTotal;

  return (
    <section className="rounded-2xl bg-surface-shell/60 p-3">
      <h3 className="text-xs uppercase tracking-[0.2em] text-brand-cyan">
        재정 상세
      </h3>

      {netHistory.length >= 2 ? (
        <div className="mt-3 rounded-xl bg-surface-raised/50 p-3">
          <p className="text-[11px] text-text-muted">
            최근 {netHistory.length}주 순수익 추이
          </p>
          <Sparkline points={netHistory} />
        </div>
      ) : null}

      <div className="mt-3 space-y-2">
        <FinanceGroup
          label="수입"
          total={incomeTotal}
          entries={incomeEntries}
          labels={FINANCE_INCOME_LABELS}
        />
        <FinanceGroup
          label="지출"
          total={expenseTotal}
          entries={expenseEntries}
          labels={FINANCE_EXPENSE_LABELS}
        />
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-2.5">
        <span className="text-xs text-text-muted">순수익</span>
        <span
          className={[
            "text-sm font-semibold tabular-nums",
            net >= 0 ? "text-state-success" : "text-state-danger",
          ].join(" ")}
        >
          {net >= 0 ? "+" : "-"}
          {formatMoney(Math.abs(net))}원
        </span>
      </div>
    </section>
  );
}

function FinanceGroup({
  label,
  total,
  entries,
  labels,
}: {
  label: string;
  total: number;
  entries: [string, number][];
  labels: Record<string, string>;
}) {
  return (
    <div className="rounded-xl bg-surface-raised/70 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted">{label}</p>
        <p className="text-sm font-semibold tabular-nums text-text-primary">
          {formatMoney(total)}원
        </p>
      </div>
      {entries.length > 0 ? (
        <ul className="mt-2 space-y-1 border-t border-white/8 pt-2 text-xs">
          {entries.map(([key, value]) => (
            <li key={key} className="flex items-center justify-between gap-2">
              <span className="text-text-muted [word-break:keep-all]">
                {labels[key] ?? key}
              </span>
              <span className="shrink-0 tabular-nums text-text-secondary">
                {formatMoney(value)}원
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** 최근 n주의 주간 순수익(수입-지출) 배열. 히스토리가 짧으면 있는 만큼만. */
function buildNetHistory(
  incomeHistory: { week: number; breakdown: Record<string, number> }[],
  expenseHistory: { week: number; breakdown: Record<string, number> }[],
  maxWeeks: number,
): number[] {
  const expenseByWeek = new Map(
    expenseHistory.map((entry) => [entry.week, sumValues(entry.breakdown)]),
  );

  return incomeHistory
    .slice(-maxWeeks)
    .map(
      (entry) =>
        sumValues(entry.breakdown) - (expenseByWeek.get(entry.week) ?? 0),
    );
}

/** 외부 라이브러리 없이 그리는 인라인 SVG 스파크라인. 0선은 점선으로 깐다. */
function Sparkline({ points }: { points: number[] }) {
  const width = 120;
  const height = 32;
  const pad = 2;
  const min = Math.min(...points, 0);
  const max = Math.max(...points, 0);
  const range = max - min || 1;

  const x = (index: number) =>
    pad + (index * (width - pad * 2)) / Math.max(points.length - 1, 1);
  const y = (value: number) =>
    pad + (1 - (value - min) / range) * (height - pad * 2);

  const path = points
    .map(
      (value, index) =>
        `${index === 0 ? "M" : "L"}${x(index).toFixed(1)},${y(value).toFixed(1)}`,
    )
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="mt-2 h-10 w-full"
      role="img"
      aria-label="최근 주간 순수익 추이 그래프"
    >
      <line
        x1={pad}
        x2={width - pad}
        y1={y(0)}
        y2={y(0)}
        stroke="var(--color-panel-border)"
        strokeWidth="1"
        strokeDasharray="2 3"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={path}
        fill="none"
        stroke="var(--color-brand-cyan)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// ── 포맷터 ─────────────────────────────────────────────────────

function nonZeroEntries(values: Record<string, number>) {
  return Object.entries(values).filter(([, value]) => value !== 0);
}

function sumValues(values: Record<string, number>) {
  return Object.values(values).reduce((sum, value) => sum + value, 0);
}

function deltaTone(value: number): "good" | "bad" | "neutral" {
  if (value >= 0.05) return "good";
  if (value <= -0.05) return "bad";
  return "neutral";
}

function formatDelta(value: number) {
  const rounded = Math.round(value * 10) / 10;
  if (rounded === 0) return "0";
  const abs = Math.abs(rounded);
  const text = Number.isInteger(abs) ? String(abs) : abs.toFixed(1);
  return `${rounded > 0 ? "+" : "-"}${text}`;
}

function formatCompact(amount: number) {
  return new Intl.NumberFormat("ko-KR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("ko-KR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}
