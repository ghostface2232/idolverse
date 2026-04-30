import type { ReactNode } from "react";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import type { WeekReport as WeekReportData } from "@/systems/weekProcessor";

interface WeekReportProps {
  report: WeekReportData;
  onClose: () => void;
}

export function WeekReport({ report, onClose }: WeekReportProps) {
  const incomeTotal = sumValues(report.finance.income);
  const expenseTotal = sumValues(report.finance.expenses);

  return (
    <Modal
      title={`W${report.week} 주간 리포트`}
      onClose={onClose}
      footer={
        <Button className="w-full" onClick={onClose}>
          확인
        </Button>
      }
    >
      <div className="space-y-5 text-sm text-slate-300">
        <ReportSection title="능력치 변동" empty="변동 없음">
          {report.statChanges.map((change) => (
            <li key={change}>{change}</li>
          ))}
        </ReportSection>

        <ReportSection title="부상 발생" empty="부상 없음">
          {report.injuries.map((injury) => (
            <li key={injury.traineeId}>{injury.traineeName} 부상 발생</li>
          ))}
        </ReportSection>

        <ReportSection title="케미/갈등" empty="갈등 없음">
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

        <ReportSection title="이벤트" empty="이벤트 없음">
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

        <ReportSection title="경고 사항" empty="경고 없음">
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
