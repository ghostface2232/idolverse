import { useEffect, useMemo, useState } from "react";
import { BadgeIcon } from "@/components/common/BadgeIcon";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Modal } from "@/components/common/Modal";
import { MoneyDisplay } from "@/components/common/MoneyDisplay";
import { PixelText } from "@/components/common/PixelText";
import { INVESTOR_COMPANIES } from "@/data/investors";
import {
  COMPANY_NAME_CANDIDATES,
  GROUP_NAME_CANDIDATES,
} from "@/data/names";
import { financeVanillaStore } from "@/stores/financeStore";
import { gameVanillaStore } from "@/stores/gameStore";
import { generateWeeklyDecisionCards } from "@/systems/generateWeeklyDecisionCards";
import { getSeasonForWeek } from "@/data/balance";
import type { GroupGender, InvestorCompany, InvestorType } from "@/types/game";

interface NewGameProps {
  onStartGame: () => void;
  onCancel: () => void;
}

type Step = "prologue" | "investor" | "group";

const PROLOGUE_TEXT =
  "당신은 K-POP 업계에서 많은 것을 이뤄낸 디렉터입니다. 당신은 능력과 열정을 겸비한 동료들과 함께 수많은 스타를 배출해 냈고, 이제 새로운 길을 향해 나아가려 합니다...";

const investorStyles: Record<
  InvestorType,
  { icon: string; label: string; color: string; badgeTone: "pink" | "cyan" | "emerald" | "amber" }
> = {
  it: {
    icon: "PC",
    label: "IT",
    color: "border-blue-300/60 bg-blue-500/14",
    badgeTone: "cyan",
  },
  entertainment: {
    icon: "MIC",
    label: "엔터",
    color: "border-violet-300/60 bg-violet-500/14",
    badgeTone: "pink",
  },
  vc: {
    icon: "ROI",
    label: "VC",
    color: "border-emerald-300/60 bg-emerald-500/14",
    badgeTone: "emerald",
  },
  cosmetic: {
    icon: "LIP",
    label: "코스메틱",
    color: "border-pink-300/60 bg-pink-500/14",
    badgeTone: "pink",
  },
  fashion: {
    icon: "FIT",
    label: "패션",
    color: "border-amber-300/60 bg-amber-500/14",
    badgeTone: "amber",
  },
};

function pickRandom(items: string[]) {
  return items[Math.floor(Math.random() * items.length)] ?? items[0];
}

function describePlaystyle(investor: InvestorCompany) {
  const descriptions: Record<InvestorType, string> = {
    it: "디지털 KPI와 바이럴 성장",
    entertainment: "무대 성과와 시상식 경쟁",
    vc: "수익 회수와 빠른 성장",
    cosmetic: "비주얼 완성도와 광고 적합도",
    fashion: "트렌드 감각과 스타일 화제성",
  };

  return descriptions[investor.type];
}

export function NewGame({ onStartGame, onCancel }: NewGameProps) {
  const [step, setStep] = useState<Step>("prologue");
  const [visibleLength, setVisibleLength] = useState(0);
  const [selectedInvestor, setSelectedInvestor] = useState<InvestorCompany>(
    INVESTOR_COMPANIES[0],
  );
  const [detailInvestor, setDetailInvestor] = useState<InvestorCompany | null>(null);
  const [confirmInvestor, setConfirmInvestor] = useState<InvestorCompany | null>(null);
  const [groupGender, setGroupGender] = useState<GroupGender>("female");
  const [companyName, setCompanyName] = useState(() => pickRandom(COMPANY_NAME_CANDIDATES));
  const [groupName, setGroupName] = useState(() => pickRandom(GROUP_NAME_CANDIDATES));

  const displayedText = PROLOGUE_TEXT.slice(0, visibleLength);
  const isPrologueComplete = visibleLength >= PROLOGUE_TEXT.length;

  useEffect(() => {
    if (step !== "prologue" || isPrologueComplete) {
      return;
    }

    const timer = window.setInterval(() => {
      setVisibleLength((current) => Math.min(current + 1, PROLOGUE_TEXT.length));
    }, 34);

    return () => window.clearInterval(timer);
  }, [isPrologueComplete, step]);

  const conditionSummary = useMemo(
    () => selectedInvestor.conditions.map((condition) => condition.description).slice(0, 2),
    [selectedInvestor],
  );

  const startGame = () => {
    const firstWeek = 1;
    const season = getSeasonForWeek(firstWeek);

    gameVanillaStore.setState(
      {
        currentWeek: firstWeek,
        currentSeason: season,
        currentYear: 1,
        currentPhase: "founding",
        groupGender,
        companyName: companyName.trim() || pickRandom(COMPANY_NAME_CANDIDATES),
        groupName: groupName.trim() || pickRandom(GROUP_NAME_CANDIDATES),
        investorType: selectedInvestor.type,
        investorConditions: selectedInvestor.conditions,
        investorPenaltyActive: false,
        gameSpeed: 1,
        weeklyDecisions: generateWeeklyDecisionCards(firstWeek, season),
        notifications: [
          {
            id: "noti-new-game",
            type: "success",
            title: "New Agency Founded",
            message: `${selectedInvestor.name} 투자를 받아 새 프로젝트를 시작했습니다.`,
            week: firstWeek,
          },
        ],
      },
      false,
    );
    financeVanillaStore.setState({ money: selectedInvestor.fundAmount }, false);
    onStartGame();
  };

  return (
    <main className="pixel-grid-bg min-h-screen bg-slate-950 px-4 py-6">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <header className="flex items-center justify-between gap-3">
          <Button tone="ghost" onClick={onCancel}>
            메뉴
          </Button>
          <div className="flex gap-2">
            {(["prologue", "investor", "group"] as Step[]).map((item, index) => (
              <span
                key={item}
                className={[
                  "h-3 w-8 rounded-full border border-slate-600",
                  step === item ? "bg-brand-cyan" : "bg-slate-800",
                ].join(" ")}
                aria-label={`Step ${index + 1}`}
              />
            ))}
          </div>
        </header>

        {step === "prologue" ? (
          <Card className="min-h-[520px] space-y-6 border-brand-cyan/40">
            <div className="rounded-[24px] border-2 border-brand-pink/50 bg-slate-950/70 p-5">
              <PixelText as="h1" className="text-3xl text-pink-200">
                PROLOGUE
              </PixelText>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.28em] text-brand-cyan">
                Director's new road
              </p>
            </div>

            <button
              className="min-h-[280px] w-full rounded-[24px] border-2 border-slate-600 bg-slate-950/58 p-5 text-left text-lg leading-9 text-slate-100 transition hover:border-brand-cyan/70"
              onClick={() => setVisibleLength(PROLOGUE_TEXT.length)}
            >
              <span className={isPrologueComplete ? "" : "typing-caret"}>
                {displayedText}
              </span>
            </button>

            <Button
              className="w-full"
              disabled={!isPrologueComplete}
              onClick={() => setStep("investor")}
            >
              다음
            </Button>
          </Card>
        ) : null}

        {step === "investor" ? (
          <section className="space-y-4">
            <div>
              <PixelText as="h1" className="text-3xl text-brand-cyan">
                투자사 선택
              </PixelText>
              <p className="mt-2 text-sm text-slate-400">
                투자자는 시작 자금과 플레이 압력을 동시에 결정합니다.
              </p>
            </div>

            <div className="flex snap-x gap-4 overflow-x-auto pb-3">
              {INVESTOR_COMPANIES.map((investor) => {
                const style = investorStyles[investor.type];
                const isSelected = selectedInvestor.id === investor.id;

                return (
                  <article
                    key={investor.id}
                    role="button"
                    tabIndex={0}
                    className={[
                      "min-w-[300px] cursor-pointer snap-center rounded-[28px] border-2 p-4 text-left shadow-[0_10px_0_rgba(15,23,42,0.7)] transition duration-150 ease-out",
                      style.color,
                      isSelected ? "ring-2 ring-brand-cyan" : "hover:border-brand-cyan/70",
                    ].join(" ")}
                    onClick={() => setSelectedInvestor(investor)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedInvestor(investor);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <BadgeIcon
                          icon={style.icon}
                          label={style.label}
                          tone={style.badgeTone}
                        />
                        <h2 className="mt-4 text-xl font-black text-slate-50">
                          {investor.name}
                        </h2>
                        <p className="mt-1 text-sm leading-5 text-slate-300">
                          {investor.description}
                        </p>
                      </div>
                    </div>
                    <MoneyDisplay amount={investor.fundAmount} className="mt-4 text-base" />
                    <ul className="mt-4 space-y-2 text-sm text-slate-200">
                      {investor.conditions.slice(0, 2).map((condition) => (
                        <li key={condition.id}>- {condition.description}</li>
                      ))}
                    </ul>
                    <Button
                      tone="ghost"
                      className="mt-4 w-full"
                      onClick={(event) => {
                        event.stopPropagation();
                        setDetailInvestor(investor);
                      }}
                    >
                      상세 보기
                    </Button>
                  </article>
                );
              })}
            </div>

            <Card className="space-y-3">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-brand-cyan">
                Selected
              </p>
              <h2 className="text-xl font-black text-slate-50">{selectedInvestor.name}</h2>
              {conditionSummary.map((condition) => (
                <p key={condition} className="text-sm text-slate-300">
                  {condition}
                </p>
              ))}
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Button tone="ghost" onClick={() => setStep("prologue")}>
                이전
              </Button>
              <Button onClick={() => setConfirmInvestor(selectedInvestor)}>
                투자사 확정
              </Button>
            </div>
          </section>
        ) : null}

        {step === "group" ? (
          <section className="space-y-4">
            <div>
              <PixelText as="h1" className="text-3xl text-brand-cyan">
                그룹 설정
              </PixelText>
              <p className="mt-2 text-sm text-slate-400">
                첫 프로젝트의 정체성을 정합니다. 이름은 이후 UI에서 교체 가능합니다.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "female" as GroupGender, label: "여자 그룹", icon: "GIRL" },
                { value: "male" as GroupGender, label: "남자 그룹", icon: "BOY" },
              ].map((option) => (
                <button
                  key={option.value}
                  className={[
                    "min-h-36 rounded-[28px] border-2 bg-slate-800 p-4 text-center shadow-[0_8px_0_rgba(15,23,42,0.7)] transition",
                    groupGender === option.value
                      ? "border-brand-pink ring-2 ring-brand-pink/50"
                      : "border-slate-600 hover:border-brand-cyan",
                  ].join(" ")}
                  onClick={() => setGroupGender(option.value)}
                >
                  <PixelText as="p" className="text-3xl text-slate-100">
                    {option.icon}
                  </PixelText>
                  <p className="mt-4 font-black text-slate-50">{option.label}</p>
                </button>
              ))}
            </div>

            <Card className="space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-black text-slate-200">회사명</span>
                <input
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  className="min-h-11 w-full rounded-2xl border-2 border-slate-600 bg-slate-950/70 px-4 text-slate-100 outline-none transition focus:border-brand-cyan"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-black text-slate-200">그룹명</span>
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <input
                    value={groupName}
                    onChange={(event) => setGroupName(event.target.value)}
                    className="min-h-11 w-full rounded-2xl border-2 border-slate-600 bg-slate-950/70 px-4 text-slate-100 outline-none transition focus:border-brand-cyan"
                  />
                  <Button
                    tone="secondary"
                    onClick={() => setGroupName(pickRandom(GROUP_NAME_CANDIDATES))}
                  >
                    랜덤
                  </Button>
                </div>
              </label>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Button tone="ghost" onClick={() => setStep("investor")}>
                이전
              </Button>
              <Button tone="success" onClick={startGame}>
                시작
              </Button>
            </div>
          </section>
        ) : null}
      </div>

      {detailInvestor ? (
        <Modal
          title={detailInvestor.name}
          onClose={() => setDetailInvestor(null)}
          footer={
            <Button
              className="w-full"
              onClick={() => {
                setSelectedInvestor(detailInvestor);
                setDetailInvestor(null);
              }}
            >
              이 투자사 선택
            </Button>
          }
        >
          <div className="space-y-5 text-sm leading-6">
            <div>
              <p className="font-black text-slate-100">조건 전문</p>
              <ul className="mt-2 space-y-2 text-slate-300">
                {detailInvestor.conditions.map((condition) => (
                  <li key={condition.id}>- {condition.description}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-black text-red-300">미달성 페널티</p>
              <ul className="mt-2 space-y-2 text-red-200">
                {detailInvestor.penaltyEffects.map((effect) => (
                  <li key={effect.type}>- {effect.description}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-black text-emerald-300">달성 보너스</p>
              <ul className="mt-2 space-y-2 text-emerald-200">
                {detailInvestor.bonusEffects.map((effect) => (
                  <li key={effect.type}>- {effect.description}</li>
                ))}
              </ul>
            </div>
            <p className="rounded-2xl border border-slate-600 bg-slate-950/60 p-4 text-slate-300">
              {detailInvestor.personality} 플레이스타일은 {describePlaystyle(detailInvestor)}에 맞춰집니다.
            </p>
          </div>
        </Modal>
      ) : null}

      {confirmInvestor ? (
        <Modal
          title="투자사 확정"
          onClose={() => setConfirmInvestor(null)}
          footer={
            <div className="grid grid-cols-2 gap-3">
              <Button tone="ghost" onClick={() => setConfirmInvestor(null)}>
                다시 선택
              </Button>
              <Button
                onClick={() => {
                  setSelectedInvestor(confirmInvestor);
                  setConfirmInvestor(null);
                  setStep("group");
                }}
              >
                확정
              </Button>
            </div>
          }
        >
          <p className="text-sm leading-6 text-slate-300">
            이 투자사를 선택하면 게임 플레이스타일이{" "}
            <span className="font-black text-brand-cyan">
              {describePlaystyle(confirmInvestor)}
            </span>
            에 맞춰집니다.
          </p>
        </Modal>
      ) : null}
    </main>
  );
}
