import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import type {
  ComebackSettlementReport,
  WeeklyReportSnapshot,
} from "@/types/game";

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
  const incomeTotal = sumValues(report.finance.income);
  const expenseTotal = sumValues(report.finance.expenses);

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
      <div className="space-y-5 text-sm text-slate-300">
        {errorMessage ? (
          <p
            role="alert"
            className="rounded-xl bg-state-danger/12 px-3 py-2 text-rose-200"
          >
            {errorMessage}
          </p>
        ) : null}

        {report.comebackSettlement ? (
          <ComebackSettlementSection settlement={report.comebackSettlement} />
        ) : null}

        <ReportSection title="멤버 성장" empty="뚜렷한 변화 없음">
          {report.statChanges.map((change) => (
            <li key={change}>{change}</li>
          ))}
        </ReportSection>

        <ReportSection title="부상 발생" empty="부상 없음">
          {report.injuries.map((injury) => (
            <li key={injury.traineeId}>{injury.traineeName} 부상 발생</li>
          ))}
        </ReportSection>

        <ReportSection title="멤버 관계" empty="갈등 없음">
          {report.conflicts.map((conflict) => (
            <li key={`${conflict.a}-${conflict.b}`}>
              {conflict.a} / {conflict.b} 갈등
              {conflict.resolved ? " 해소" : " 발생"}
            </li>
          ))}
        </ReportSection>

        <section className="rounded-2xl bg-slate-950/50 p-3">
          <h3 className="text-xs uppercase tracking-[0.2em] text-brand-cyan">
            재정 요약
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <FinanceBox label="수입" amount={incomeTotal} />
            <FinanceBox label="지출" amount={expenseTotal} />
          </div>
        </section>

        <ReportSection title="이번 주 주요 소식" empty="주요 소식 없음">
          {report.events.map((event) => (
            <li key={event.id}>{event.title}</li>
          ))}
        </ReportSection>

        <ReportSection title="K-POP 뉴스" empty="뉴스 없음">
          {report.news.map((news) => (
            <li key={news.id}>{news.headline}</li>
          ))}
        </ReportSection>

        <ReportSection title="경쟁 그룹 동향" empty="컴백 소식 없음">
          {report.competitorComebacks.map((comeback) => (
            <li key={comeback}>{comeback} 컴백</li>
          ))}
        </ReportSection>

        <ReportSection title="확인할 문제" empty="확인할 문제 없음">
          {report.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ReportSection>
      </div>
    </Modal>
  );
}

/** 컴백 정산 주에만 등장하는 격상 섹션. 성과 정리와 다음 사이클 훅을 함께 낸다. */
function ComebackSettlementSection({
  settlement,
}: {
  settlement: ComebackSettlementReport;
}) {
  return (
    <section className="rounded-2xl bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.14),transparent_55%)] bg-slate-950/60 p-3 shadow-[inset_0_0_0_1px_rgba(236,72,153,0.25)]">
      <h3 className="flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-pink-300">
        <Sparkles className="size-3.5" aria-hidden="true" />
        컴백 정산 — {settlement.albumTitle}
      </h3>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <SettlementStat label="차트 최고" value={`${settlement.chartPeak}위`} />
        <SettlementStat
          label="음악방송"
          value={
            settlement.musicShowWon === null
              ? "미개최"
              : settlement.musicShowWon
                ? "1위 달성"
                : "1위 후보"
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
        <p className="mt-2 text-xs text-emerald-200">
          이번 활동으로 팬덤 +{settlement.fanGrowth}
        </p>
      ) : null}
      {settlement.investorNotes.length > 0 ? (
        <ul className="mt-3 space-y-1 text-xs text-slate-400">
          {settlement.investorNotes.map((note) => (
            <li key={note}>투자사 {note}</li>
          ))}
        </ul>
      ) : null}
      <p className="mt-3 rounded-xl bg-slate-900/70 px-3 py-2 text-pretty text-xs leading-5 text-slate-200">
        {settlement.nextHook}
      </p>
    </section>
  );
}

function SettlementStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-800/70 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function formatCompact(amount: number) {
  return new Intl.NumberFormat("ko-KR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

function ReportSection({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: ReactNode;
}) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children;
  const hasItems = Array.isArray(items) ? items.length > 0 : Boolean(items);

  return (
    <section className="rounded-2xl bg-slate-950/50 p-3">
      <h3 className="text-xs uppercase tracking-[0.2em] text-brand-cyan">
        {title}
      </h3>
      {hasItems ? (
        <ul className="mt-3 list-disc space-y-1 pl-5">{items}</ul>
      ) : (
        <p className="mt-3 text-slate-500">{empty}</p>
      )}
    </section>
  );
}

function FinanceBox({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="rounded-xl bg-slate-800/70 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-sm text-slate-100">{formatMoney(amount)}</p>
    </div>
  );
}

function sumValues(values: Record<string, number>) {
  return Object.values(values).reduce((sum, value) => sum + value, 0);
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("ko-KR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}
