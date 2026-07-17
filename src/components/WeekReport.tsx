import type { ReactNode } from "react";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import type { WeeklyReportSnapshot } from "@/types/game";

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
