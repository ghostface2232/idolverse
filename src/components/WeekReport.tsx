import type { ReactNode } from "react";
import {
  Coins,
  Globe,
  HeartPulse,
  Landmark,
  MessageCircle,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  Users,
} from "lucide-react";
import { Alert } from "@/components/common/Alert";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { AlbumArt } from "@/components/visual/AlbumArt";
import { GroupBadge } from "@/components/visual/GroupBadge";
import { MemberPortrait } from "@/components/visual/MemberPortrait";
import { SceneThumb } from "@/components/visual/SceneThumb";
import { SpeakerBubble } from "@/components/visual/SpeakerBubble";
import { StaffPortrait } from "@/components/visual/StaffPortrait";
import {
  hashSeed,
  MANAGER_REPORT_LINES,
  MEMBER_VOICE_LINES,
  pickLine,
  type ManagerReportContext,
  type MemberVoiceContext,
} from "@/data/voiceLines";
import type { SceneKey } from "@/data/sceneArt";
import { useFinanceStore } from "@/stores/financeStore";
import { useTraineeStore } from "@/stores/traineeStore";
import { useManagerPersona } from "@/utils/managerPersona";
import { sceneForEvent } from "@/utils/sceneMapping";
import type {
  ComebackSettlementReport,
  Trainee,
  WeekDelta,
  WeeklyReportSnapshot,
} from "@/types/game";
import { withJosa } from "@/utils/josa";
import { formatKoreanWon } from "@/utils/formatKoreanWon";
import {
  isDangerousWeekDelta,
  isGoodWeekDelta,
} from "@/utils/weekDeltaTone";
import {
  ALBUM_UNIT_MARGIN,
  calculateAlbumLifetimeRevenue,
} from "@/systems/economySystem";

interface WeekReportProps {
  report: WeeklyReportSnapshot;
  isSaving?: boolean;
  errorMessage?: string | null;
  onClose: () => void | Promise<void>;
}

const STAT_FIELD_LABELS: Record<string, string> = {
  "stats.visual": "비주얼",
  "stats.vocal": "보컬",
  "stats.dance": "댄스",
  "stats.charm": "끼",
  "stats.stamina": "체력",
  "stats.mental": "멘탈",
};

const FANDOM_FIELD_META: Record<string, { label: string; icon: typeof Users }> = {
  public: { label: "대중 인지도", icon: TrendingUp },
  fandom: { label: "코어 팬덤", icon: Users },
  fandomLoyalty: { label: "팬 충성도", icon: HeartPulse },
  fandomDisappointment: { label: "팬 실망", icon: TriangleAlert },
  global: { label: "해외 팬덤", icon: Globe },
  industry: { label: "업계 평판", icon: Landmark },
};

/** 증가가 오히려 나쁜 지표. 색을 뒤집는다. */
const BAD_WHEN_UP_FIELDS = new Set(["fandomDisappointment"]);

export function WeekReport({
  report,
  isSaving = false,
  errorMessage,
  onClose,
}: WeekReportProps) {
  const money = useFinanceStore((state) => state.money);
  const incomeHistory = useFinanceStore((state) => state.incomeHistory);
  const expenseHistory = useFinanceStore((state) => state.expenseHistory);
  const trainees = useTraineeStore((state) => state.trainees);
  const manager = useManagerPersona();

  const deltas = report.deltas ?? [];
  const incomeTotal = sumValues(report.finance.income);
  const expenseTotal = sumValues(report.finance.expenses);
  const net = incomeTotal - expenseTotal;

  const fandomChange = sumNumericDeltas(
    deltas,
    (delta) => delta.target.kind === "fandom" && delta.target.field === "fandom",
  );
  const statGrowth = sumNumericDeltas(
    deltas,
    (delta) =>
      delta.target.kind === "trainee" && delta.target.field.startsWith("stats."),
  );
  const memberGrowthRows = buildMemberGrowthRows(deltas, trainees);
  const fandomChips = aggregateDeltaChips(
    deltas,
    (delta) => delta.target.kind === "fandom",
  );

  // 헤드라인 우선순위: 컴백 정산 > 경고 첫 건 > 부상 첫 건 > 좋은 소식 첫 건.
  const highlights = report.highlights ?? [];
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
  const headlineHighlight =
    report.comebackSettlement || headlineWarning || headlineInjury
      ? null
      : (highlights[0] ?? null);
  const remainingHighlights = headlineHighlight
    ? highlights.slice(1)
    : highlights;

  const netHistory = buildNetHistory(incomeHistory, expenseHistory, 12);

  // 연출(차트 공개·음악방송) 이벤트는 결산 뒤에 열리는 오버레이가 공개한다.
  // 결산에 제목("음악방송 1위" 등)이 먼저 보이면 스포일러라 목록에서 뺀다.
  const visibleEvents = report.events.filter((event) => !event.presentation);

  const isQuietWeek =
    memberGrowthRows.length === 0 &&
    fandomChips.length === 0 &&
    report.injuries.length === 0 &&
    report.conflicts.length === 0 &&
    report.events.length === 0 &&
    report.competitorComebacks.length === 0 &&
    !report.comebackSettlement &&
    report.warnings.length === 0 &&
    highlights.length === 0;

  // 이번 주의 얼굴이 될 헤드라인 씬과 문장.
  const hero = resolveHero({
    report,
    headlineWarning,
    headlineInjury,
    headlineHighlight,
    statGrowth,
  });

  const managerContext = resolveManagerContext({
    report,
    net,
    statGrowth,
    isQuietWeek,
  });
  const managerLine = pickLine(
    MANAGER_REPORT_LINES[managerContext],
    hashSeed(`${report.week}:${managerContext}`),
  );

  const memberVoices = buildMemberVoices(
    report,
    trainees,
    memberGrowthRows,
    isQuietWeek,
  );
  const decisionOutcomes = buildDecisionOutcomes(deltas);

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

        {/* ── 헤드라인: 이번 주의 얼굴 ───────────────────────── */}
        <section>
          <SceneThumb scene={hero.scene} variant="banner" label={hero.label} />
          <p className="mt-3 flex items-start gap-2 text-balance text-base font-semibold leading-6 text-text-primary [word-break:keep-all]">
            {hero.text}
          </p>
        </section>

        {decisionOutcomes.length > 0 ? (
          <section
            className="rounded-3xl bg-[linear-gradient(135deg,rgba(236,72,153,0.11),rgba(6,182,212,0.07))] p-4 shadow-[var(--shadow-surface)]"
            aria-labelledby="decision-outcome-heading"
          >
            <h2
              id="decision-outcome-heading"
              className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.08em] text-pink-200"
            >
              <Sparkles className="size-4" aria-hidden="true" />
              내 선택이 만든 변화
            </h2>
            <div className="mt-3 space-y-3">
              {decisionOutcomes.map((outcome) => (
                <article key={outcome.id}>
                  <p className="text-sm font-semibold text-text-primary">
                    {outcome.label}
                  </p>
                  <ul className="mt-1.5 flex flex-wrap gap-1.5">
                    {outcome.changes.map((change) => (
                      <li
                        key={change.id}
                        className={[
                          "rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums shadow-[inset_0_0_0_1px_currentColor]",
                          change.isGood
                            ? "bg-emerald-400/10 text-emerald-200"
                            : change.isDanger
                              ? "bg-state-danger/10 text-rose-200"
                              : "bg-amber-400/10 text-amber-200",
                        ].join(" ")}
                      >
                        {change.label} {change.value}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {report.comebackSettlement ? (
          <ComebackSettlementSection settlement={report.comebackSettlement} />
        ) : null}

        {/* ── 핵심 숫자: 요약을 가장 먼저 ─────────────────────── */}
        <div className="grid grid-cols-2 gap-2">
          <StatTile
            label="이번 주 순수익"
            value={`${net >= 0 ? "+" : "-"}${formatKoreanWon(Math.abs(net))}`}
            tone={net >= 0 ? "good" : "bad"}
            hint={`수입 ${formatKoreanWon(incomeTotal)} · 지출 ${formatKoreanWon(expenseTotal)}`}
          />
          <StatTile
            label="회사 잔액"
            value={`${money < 0 ? "-" : ""}${formatKoreanWon(Math.abs(money))}`}
            tone={money < 0 ? "bad" : "neutral"}
            hint="누적 보유 자금"
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

        <SpeakerBubble
          portrait={
            <StaffPortrait
              profileImagePath={manager.profileImagePath}
              profileSpriteIndex={manager.profileSpriteIndex}
              size="md"
            />
          }
          name={manager.name}
          role={manager.roleLabel}
          tone={managerContext === "crisis" || managerContext === "injury" ? "warning" : "default"}
        >
          {managerLine}
        </SpeakerBubble>

        {/* ── 멤버 성장: 얼굴이 보이는 성장 기록 ─────────────── */}
        {memberGrowthRows.length > 0 ? (
          <ReportCard title="멤버 성장">
            <ul className="space-y-2.5">
              {memberGrowthRows.map((row) => (
                <li key={row.traineeId} className="flex items-center gap-2.5">
                  <MemberPortrait traineeId={row.traineeId} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text-primary">
                      {row.name}
                    </p>
                    <ul className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
                      {row.chips.map((chip) => (
                        <li key={chip.key} className="text-xs">
                          <span className="text-text-muted">{chip.label}</span>{" "}
                          <span
                            className={`font-semibold tabular-nums ${
                              chip.value > 0
                                ? "text-state-success"
                                : "text-state-danger"
                            }`}
                          >
                            {formatDelta(chip.value)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-bold tabular-nums ${
                      row.total > 0 ? "text-state-success" : "text-state-danger"
                    }`}
                  >
                    {formatDelta(row.total)}
                  </span>
                </li>
              ))}
            </ul>
          </ReportCard>
        ) : report.statChanges.length > 0 ? (
          <ReportCard title="멤버 성장">
            <BulletList items={report.statChanges} />
          </ReportCard>
        ) : null}

        {/* ── 멤버 보이스: 숫자를 사람의 말로 ────────────────── */}
        {memberVoices.length > 0 ? (
          <ReportCard title="이번 주 멤버 한마디">
            <div className="space-y-3">
              {memberVoices.map((voice) => (
                <SpeakerBubble
                  key={voice.traineeId}
                  portrait={<MemberPortrait traineeId={voice.traineeId} size="sm" />}
                  name={voice.name}
                  tone={voice.tone}
                >
                  {voice.line}
                </SpeakerBubble>
              ))}
            </div>
          </ReportCard>
        ) : null}

        {/* ── 팬덤 반응: 4축을 게이지 감각으로 ───────────────── */}
        {fandomChips.length > 0 ? (
          <ReportCard title="팬덤 반응">
            <ul className="space-y-1.5">
              {fandomChips.map((chip) => {
                const meta = FANDOM_FIELD_META[chip.field];
                const Icon = meta?.icon ?? Users;
                const isGood = BAD_WHEN_UP_FIELDS.has(chip.field)
                  ? chip.value < 0
                  : chip.value > 0;

                return (
                  <li key={chip.key} className="flex items-center gap-2.5">
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-surface-raised text-text-muted">
                      <Icon className="size-3.5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs text-text-secondary">
                      {meta?.label ?? chip.label}
                    </span>
                    <DeltaMeter value={chip.value} isGood={isGood} />
                    <span
                      className={`w-11 shrink-0 text-right text-xs font-semibold tabular-nums ${
                        isGood ? "text-state-success" : "text-state-danger"
                      }`}
                    >
                      {formatDelta(chip.value)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </ReportCard>
        ) : null}

        {/* ── 부상·관계 ──────────────────────────────────────── */}
        {remainingInjuries.length > 0 || report.conflicts.length > 0 ? (
          <ReportCard title="컨디션과 관계">
            <ul className="space-y-2">
              {remainingInjuries.map((injury) => (
                <li key={injury.traineeId} className="flex items-center gap-2.5">
                  <MemberPortrait traineeId={injury.traineeId} size="xs" />
                  <span className="text-xs text-text-secondary [word-break:keep-all]">
                    {withJosa(injury.traineeName, "이/가")} 부상을 입었습니다.
                  </span>
                </li>
              ))}
              {report.conflicts.map((conflict) => (
                <li
                  key={`${conflict.a}-${conflict.b}`}
                  className="flex items-center gap-2.5"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-surface-raised text-text-muted">
                    <MessageCircle className="size-3.5" aria-hidden="true" />
                  </span>
                  <span className="text-xs text-text-secondary [word-break:keep-all]">
                    {withJosa(conflict.a, "과/와")} {conflict.b} 사이의 갈등이
                    {conflict.resolved ? " 풀렸습니다." : " 불거졌습니다."}
                  </span>
                </li>
              ))}
            </ul>
          </ReportCard>
        ) : null}

        {/* ── 소식·뉴스·경쟁 동향 ────────────────────────────── */}
        {visibleEvents.length > 0 ? (
          <ReportCard title="이번 주 주요 소식">
            <ul className="space-y-2">
              {visibleEvents.map((event) => (
                <li key={event.id} className="flex items-center gap-2.5">
                  <SceneThumb scene={sceneForEvent(event)} variant="chip" />
                  <span className="min-w-0 flex-1 text-xs text-text-secondary [word-break:keep-all]">
                    {event.title}
                  </span>
                </li>
              ))}
            </ul>
          </ReportCard>
        ) : null}

        {report.news.length > 0 ? (
          <ReportCard title="K-POP 뉴스">
            <ul className="space-y-2">
              {report.news.map((news) => (
                <li key={news.id} className="flex items-center gap-2.5">
                  <SceneThumb scene={sceneForHeadline(news.headline)} variant="chip" />
                  <span className="min-w-0 flex-1 text-xs text-text-secondary [word-break:keep-all]">
                    {news.headline}
                  </span>
                </li>
              ))}
            </ul>
          </ReportCard>
        ) : null}

        {report.competitorComebacks.length > 0 ? (
          <ReportCard title="경쟁 그룹 동향">
            <ul className="space-y-2">
              {report.competitorComebacks.map((comeback) => (
                <li key={comeback} className="flex items-center gap-2.5">
                  <GroupBadge name={comeback} size="sm" />
                  <span className="min-w-0 flex-1 text-xs text-text-secondary [word-break:keep-all]">
                    {withJosa(comeback, "이/가")} 컴백 활동을 시작했습니다.
                  </span>
                </li>
              ))}
            </ul>
          </ReportCard>
        ) : null}

        {remainingHighlights.length > 0 ? (
          <ReportCard title="이번 주 좋은 소식">
            <ul className="space-y-2">
              {remainingHighlights.map((highlight) => (
                <li key={highlight} className="flex items-start gap-2">
                  <Sparkles
                    className="mt-0.5 size-3.5 shrink-0 text-emerald-300"
                    aria-hidden="true"
                  />
                  <span className="text-xs leading-5 text-text-secondary [word-break:keep-all]">
                    {highlight}
                  </span>
                </li>
              ))}
            </ul>
          </ReportCard>
        ) : null}

        {remainingWarnings.length > 0 ? (
          <ReportCard title="확인할 문제">
            <ul className="space-y-2">
              {remainingWarnings.map((warning) => (
                <li key={warning} className="flex items-start gap-2">
                  <TriangleAlert
                    className="mt-0.5 size-3.5 shrink-0 text-state-warning"
                    aria-hidden="true"
                  />
                  <span className="text-xs leading-5 text-text-secondary [word-break:keep-all]">
                    {warning}
                  </span>
                </li>
              ))}
            </ul>
          </ReportCard>
        ) : null}

        {isQuietWeek ? (
          <p className="rounded-2xl bg-surface-shell/60 p-4 text-center text-text-muted">
            큰 사건 없이 흘러간 한 주였습니다.
          </p>
        ) : null}

        <FinanceSection finance={report.finance} netHistory={netHistory} />
      </div>
    </Modal>
  );
}

interface DecisionOutcome {
  id: string;
  label: string;
  changes: Array<{
    id: string;
    label: string;
    value: string;
    isGood: boolean;
    isDanger: boolean;
  }>;
}

function buildDecisionOutcomes(deltas: WeekDelta[]): DecisionOutcome[] {
  const grouped = new Map<string, DecisionOutcome>();

  for (const delta of deltas) {
    if (
      delta.source.kind !== "decision" ||
      typeof delta.before !== "number" ||
      typeof delta.after !== "number"
    ) {
      continue;
    }
    const difference = delta.after - delta.before;
    if (difference === 0) continue;

    const isGood = isGoodWeekDelta(delta) ?? false;
    const value =
      delta.target.kind === "finance"
        ? `${difference > 0 ? "+" : "-"}${formatKoreanWon(Math.abs(difference))}`
        : formatDelta(difference);
    const current = grouped.get(delta.source.id) ?? {
      id: delta.source.id,
      label: delta.source.label,
      changes: [],
    };
    current.changes.push({
      id: delta.id,
      label: delta.target.label,
      value,
      isGood,
      isDanger: isDangerousWeekDelta(delta),
    });
    grouped.set(delta.source.id, current);
  }

  return [...grouped.values()].slice(0, 3).map((outcome) => ({
    ...outcome,
    changes: outcome.changes
      .sort((left, right) => Number(right.isDanger) - Number(left.isDanger))
      .slice(0, 4),
  }));
}

// ── 헤드라인 결정 ──────────────────────────────────────────────

interface HeroResult {
  scene: SceneKey;
  label: string;
  text: string;
}

function resolveHero({
  report,
  headlineWarning,
  headlineInjury,
  headlineHighlight,
  statGrowth,
}: {
  report: WeeklyReportSnapshot;
  headlineWarning: string | null;
  headlineInjury: { traineeName: string } | null;
  headlineHighlight: string | null;
  statGrowth: number;
}): HeroResult {
  if (report.comebackSettlement) {
    const settlement = report.comebackSettlement;
    const won = (settlement.musicShowWins ?? 0) > 0;
    return {
      scene: won ? "trophy" : "comeback",
      label: "컴백 정산",
      text: won
        ? `'${settlement.albumTitle}' 활동 종료. 음악방송 1위 ${settlement.musicShowWins}회의 성과를 남겼습니다.`
        : `'${settlement.albumTitle}' 활동이 끝났습니다. 차트 최고 ${settlement.chartPeak}위를 기록했습니다.`,
    };
  }

  if (headlineWarning) {
    return { scene: "scandal", label: "이번 주 헤드라인", text: headlineWarning };
  }

  if (headlineInjury) {
    return {
      scene: "hospital",
      label: "이번 주 헤드라인",
      text: `${withJosa(headlineInjury.traineeName, "이/가")} 부상을 입었습니다. 이번 주 일정 조정이 필요합니다.`,
    };
  }

  // 좋은 소식은 경고와 다른 씬으로 연출한다 — 수상 주에 스캔들 씬이 뜨면 안 된다.
  if (headlineHighlight) {
    return {
      scene: sceneForHeadline(headlineHighlight),
      label: "이번 주 헤드라인",
      text: headlineHighlight,
    };
  }

  // 연출 이벤트 제목("음악방송 1위" 등)은 헤드라인으로도 쓰지 않는다 —
  // 결과 공개는 결산 뒤의 오버레이 몫이다.
  const headlineEvent = report.events.find((event) => !event.presentation);
  if (headlineEvent) {
    return {
      scene: sceneForEvent(headlineEvent),
      label: "이번 주 헤드라인",
      text: headlineEvent.title,
    };
  }

  if (statGrowth >= 1) {
    return {
      scene: "practice",
      label: `${report.week}주차`,
      text: "연습실의 한 주. 눈에 띄는 성장이 쌓였습니다.",
    };
  }

  return {
    scene: "dorm",
    label: `${report.week}주차`,
    text: "차분하게 흘러간 한 주입니다.",
  };
}

function resolveManagerContext({
  report,
  net,
  statGrowth,
  isQuietWeek,
}: {
  report: WeeklyReportSnapshot;
  net: number;
  statGrowth: number;
  isQuietWeek: boolean;
}): ManagerReportContext {
  if (report.comebackSettlement) return "settlement";
  if (report.injuries.length > 0) return "injury";
  if (report.warnings.length > 0) return "crisis";
  if (isQuietWeek) return "quiet";
  if (statGrowth >= 1.5) return "growth";
  if (net < 0) return "loss";
  return "quiet";
}

// ── 멤버 성장 행 ───────────────────────────────────────────────

interface MemberGrowthRow {
  traineeId: string;
  name: string;
  total: number;
  chips: { key: string; label: string; value: number }[];
}

function buildMemberGrowthRows(
  deltas: WeekDelta[],
  trainees: Trainee[],
): MemberGrowthRow[] {
  const rows = new Map<string, MemberGrowthRow>();

  for (const delta of deltas) {
    if (delta.target.kind !== "trainee") continue;
    if (!delta.target.field.startsWith("stats.")) continue;
    if (typeof delta.before !== "number" || typeof delta.after !== "number") {
      continue;
    }
    const traineeId = delta.target.id;
    if (!traineeId) continue;

    const diff = delta.after - delta.before;
    const trainee = trainees.find((candidate) => candidate.id === traineeId);
    const row = rows.get(traineeId) ?? {
      traineeId,
      name: trainee?.name ?? delta.target.label,
      total: 0,
      chips: [],
    };
    row.total += diff;

    const label = STAT_FIELD_LABELS[delta.target.field] ?? delta.target.field;
    const chip = row.chips.find((candidate) => candidate.key === delta.target.field);
    if (chip) {
      chip.value += diff;
    } else {
      row.chips.push({ key: delta.target.field, label, value: diff });
    }
    rows.set(traineeId, row);
  }

  return [...rows.values()]
    .map((row) => ({
      ...row,
      chips: row.chips.filter((chip) => Math.abs(chip.value) >= 0.05),
    }))
    .filter((row) => Math.abs(row.total) >= 0.05)
    .sort((a, b) => b.total - a.total);
}

// ── 멤버 보이스 ────────────────────────────────────────────────

interface MemberVoice {
  traineeId: string;
  name: string;
  line: string;
  tone: "default" | "accent" | "warning";
}

/** 이번 주 상황에 맞는 멤버 반응을 최대 2건 고른다. 시드 기반이라 같은 주엔 같은 말이 나온다. */
function buildMemberVoices(
  report: WeeklyReportSnapshot,
  trainees: Trainee[],
  growthRows: MemberGrowthRow[],
  isQuietWeek: boolean,
): MemberVoice[] {
  const voices: MemberVoice[] = [];
  const used = new Set<string>();

  const pushVoice = (
    trainee: Trainee | undefined,
    context: MemberVoiceContext,
    tone: MemberVoice["tone"],
  ) => {
    if (!trainee || used.has(trainee.id) || voices.length >= 2) return;
    used.add(trainee.id);
    voices.push({
      traineeId: trainee.id,
      name: trainee.name,
      line: pickLine(
        MEMBER_VOICE_LINES[context],
        hashSeed(`${report.week}:${trainee.id}:${context}`),
      ),
      tone,
    });
  };

  // 우선순위: 성과(1위/컴백 종료) > 부상 > 갈등 > 최고 성장 > 지친 멤버 >
  // 크게 불만인 멤버 > 기분 좋은 멤버 > 조용한 주 소감.
  if (report.comebackSettlement) {
    const won = (report.comebackSettlement.musicShowWins ?? 0) > 0;
    const spokesperson =
      trainees[hashSeed(`${report.week}:settlement`) % Math.max(trainees.length, 1)];
    pushVoice(spokesperson, won ? "win" : "comeback", won ? "accent" : "default");
  }

  if (report.injuries.length > 0) {
    const injured = trainees.find(
      (candidate) => candidate.id === report.injuries[0].traineeId,
    );
    pushVoice(injured, "injured", "warning");
  }

  const unresolvedConflict = report.conflicts.find((conflict) => !conflict.resolved);
  if (unresolvedConflict) {
    const member = trainees.find(
      (candidate) => candidate.name === unresolvedConflict.a,
    );
    pushVoice(member, "conflict", "warning");
  }

  if (growthRows.length > 0 && growthRows[0].total >= 0.5) {
    const top = trainees.find((candidate) => candidate.id === growthRows[0].traineeId);
    pushVoice(top, "growth", "accent");
  }

  if (voices.length < 2) {
    const tired = trainees.find(
      (candidate) => candidate.stress >= 70 && !used.has(candidate.id),
    );
    pushVoice(tired, "tired", "warning");
  }

  if (voices.length < 2) {
    const unhappy = trainees.find(
      (candidate) => candidate.satisfaction <= 30 && !used.has(candidate.id),
    );
    pushVoice(unhappy, "unhappy", "warning");
  }

  if (voices.length < 2) {
    const happy = trainees.find(
      (candidate) =>
        candidate.satisfaction >= 70 &&
        candidate.stress < 50 &&
        !used.has(candidate.id),
    );
    pushVoice(happy, "happy", "default");
  }

  // 아무 목소리도 없는 조용한 주에는 일상 소감이라도 싣는다 — 침묵보다 낫다.
  if (voices.length === 0 && isQuietWeek && trainees.length > 0) {
    const speaker =
      trainees[hashSeed(`${report.week}:quiet`) % trainees.length];
    pushVoice(speaker, "quiet", "default");
  }

  return voices;
}

// ── 뉴스 헤드라인 → 씬 ────────────────────────────────────────

function sceneForHeadline(headline: string): SceneKey {
  if (/컴백/.test(headline)) return "comeback";
  if (/데뷔/.test(headline)) return "debut";
  if (/차트|1위/.test(headline)) return "chart";
  if (/시상|수상|어워드/.test(headline)) return "award";
  if (/해외|글로벌|빌보드|월드/.test(headline)) return "global";
  if (/예능|방송/.test(headline)) return "variety";
  if (/콘서트|공연|무대/.test(headline)) return "concert";
  return "news";
}

// ── 이하 기존 구성 요소 ────────────────────────────────────────

/** 핵심 숫자 타일. 라벨은 작게, 숫자는 크게. */
function StatTile({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string;
  tone: "good" | "bad" | "neutral";
  hint?: string;
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
      {hint ? (
        <p className="mt-0.5 text-[11px] tabular-nums text-text-muted [word-break:keep-all]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** 변화량을 즉시 읽히게 하는 미니 막대. 최대 ±10을 풀스케일로 본다. */
function DeltaMeter({ value, isGood }: { value: number; isGood: boolean }) {
  const magnitude = Math.min(Math.abs(value) / 10, 1);

  return (
    <span
      aria-hidden="true"
      className="relative h-1.5 w-14 shrink-0 overflow-hidden rounded-full bg-white/[0.07]"
    >
      <span
        className={`absolute inset-y-0 left-0 rounded-full ${
          isGood ? "bg-state-success/80" : "bg-state-danger/80"
        }`}
        style={{ width: `${Math.max(magnitude * 100, 8)}%` }}
      />
    </span>
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
      <div className="flex items-center gap-3">
        <AlbumArt title={settlement.albumTitle} size="md" />
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-brand-pink">
            <Sparkles className="size-3.5" aria-hidden="true" />
            컴백 정산
          </h3>
          <p className="mt-0.5 truncate text-sm font-semibold text-text-primary">
            {settlement.albumTitle}
          </p>
        </div>
      </div>
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
      <div className="mt-2 rounded-xl bg-emerald-400/[0.08] px-3 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-text-muted">음반 예상 총수익</span>
          <span className="text-sm font-semibold tabular-nums text-emerald-200">
            {formatKoreanWon(
              calculateAlbumLifetimeRevenue(settlement.firstWeekSales),
            )}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-text-muted">
          초동 {settlement.firstWeekSales.toLocaleString("ko-KR")}장 × 장당 정산{" "}
          {ALBUM_UNIT_MARGIN.toLocaleString("ko-KR")}원, 발매 후 5주에 걸쳐
          들어옵니다.
        </p>
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

// 재무 모달(FinanceOverviewModal)과 같은 key에 같은 한국어를 쓴다 —
// 결산과 재무 화면에서 항목명이 다르면 별개 돈줄로 오독된다.
const FINANCE_INCOME_LABELS: Record<string, string> = {
  streaming: "음원 스트리밍",
  album: "음반 판매",
  promotions: "공연·프로모션",
  commercialContracts: "광고·외부 계약",
  strategicExpansion: "팬 사업·글로벌 사업",
  emergencyFinancing: "긴급 자금 조달",
  decisionSupport: "협상·지원금",
};

const FINANCE_EXPENSE_LABELS: Record<string, string> = {
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
      <h3 className="flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-brand-cyan">
        <Coins className="size-3.5" aria-hidden="true" />
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
        <span className="text-xs text-text-muted">이번 주 순수익</span>
        <span
          className={[
            "text-sm font-semibold tabular-nums",
            net >= 0 ? "text-state-success" : "text-state-danger",
          ].join(" ")}
        >
          {net >= 0 ? "+" : "-"}
          {formatKoreanWon(Math.abs(net))}
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
          {formatKoreanWon(total)}
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
                {formatKoreanWon(value)}
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
