import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Modal } from "@/components/common/Modal";
import { MoneyDisplay } from "@/components/common/MoneyDisplay";
import { PixelText } from "@/components/common/PixelText";
import { radioTileClasses } from "@/components/common/selectionTokens";
import { INVESTOR_COMPANIES } from "@/data/investors";
import {
  COMPANY_NAME_CANDIDATES,
  GROUP_NAME_CANDIDATES,
} from "@/data/names";
import { competitorVanillaStore } from "@/stores/competitorStore";
import { financeVanillaStore } from "@/stores/financeStore";
import { gameVanillaStore } from "@/stores/gameStore";
import { resetAllStores } from "@/stores/resetAllStores";
import { initializePermanentRivals } from "@/systems/competitorSystem";
import { getSeasonForWeek } from "@/data/balance";
import type { GroupGender, InvestorCompany, InvestorType } from "@/types/game";
import { assetUrl } from "@/utils/assets";

interface NewGameProps {
  onStartGame: () => void;
  onCancel: () => void;
}

type Step = "prologue" | "investor" | "group";

const PROLOGUE_TEXT =
  "당신은 K-POP 업계에서 많은 것을 이뤄낸 디렉터입니다. 당신은 능력과 열정을 겸비한 동료들과 함께 수많은 스타를 배출해 냈고, 이제 새로운 길을 향해 나아가려 합니다... 바로 당신만의 회사와 그룹을 만드는 것이죠.";

const PROLOGUE_IMAGE_SRC = assetUrl("/prologue-director.png");

const investorStyles: Record<
  InvestorType,
  {
    color: string;
    logoSrc: string;
  }
> = {
  it: {
    color: "border-blue-300/60",
    logoSrc: assetUrl("/investors/nextbeat.png"),
  },
  entertainment: {
    color: "border-violet-300/60",
    logoSrc: assetUrl("/investors/crownmusic-ent.png"),
  },
  vc: {
    color: "border-emerald-300/60",
    logoSrc: assetUrl("/investors/summit-capital.png"),
  },
  cosmetic: {
    color: "border-pink-300/60",
    logoSrc: assetUrl("/investors/lumiere-beauty.png"),
  },
  fashion: {
    color: "border-amber-300/60",
    logoSrc: assetUrl("/investors/maison-group.png"),
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
  const investorScrollerRef = useRef<HTMLDivElement | null>(null);
  const investorCardRefs = useRef(new Map<string, HTMLElement>());

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

  const selectCenteredInvestor = () => {
    const scroller = investorScrollerRef.current;

    if (!scroller) {
      return;
    }

    const scrollerRect = scroller.getBoundingClientRect();
    const scrollerCenter = scrollerRect.left + scrollerRect.width / 2;
    let nearestInvestor = selectedInvestor;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const investor of INVESTOR_COMPANIES) {
      const card = investorCardRefs.current.get(investor.id);

      if (!card) {
        continue;
      }

      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const distance = Math.abs(cardCenter - scrollerCenter);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestInvestor = investor;
      }
    }

    if (nearestInvestor.id !== selectedInvestor.id) {
      setSelectedInvestor(nearestInvestor);
    }
  };

  const focusInvestorCard = (investor: InvestorCompany) => {
    setSelectedInvestor(investor);
    investorCardRefs.current.get(investor.id)?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  };

  const startGame = () => {
    const firstWeek = 1;
    const season = getSeasonForWeek(firstWeek);

    // 이전 판의 상태(팬덤/앨범/라이벌/일정/이벤트 포함)가 새 게임으로 누출되지 않도록
    // 게임별 설정을 쓰기 전에 모든 스토어를 초기화한다.
    resetAllStores();

    const { rivals, backgroundGroups } = initializePermanentRivals(
      0,
      groupGender,
      Date.now(),
    );
    competitorVanillaStore.setState(
      {
        permanentRivals: rivals,
        eventRivals: [],
        backgroundGroups,
      },
      false,
    );

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
        investorConditionProgress: {},
        investorPressureWeeks: 0,
        investorComplianceCount: 0,
        lastOpportunityWeek: null,
        weeklyDecisions: [],
        notifications: [
          {
            id: "noti-new-game",
            type: "success",
            title: "새 기획사 설립",
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
    <main className="pixel-grid-bg h-dvh overflow-hidden bg-slate-950 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]">
      <div className="mx-auto flex h-full w-full max-w-md flex-col gap-3 px-4">
        <header className="flex items-center justify-between gap-3">
          <Button tone="ghost" onClick={onCancel}>
            처음으로
          </Button>
          <div className="flex gap-2">
            {(["prologue", "investor", "group"] as Step[]).map((item, index, steps) => (
              <span
                key={item}
                className={[
                  "h-3 w-8 rounded-full border border-slate-600 transition-colors duration-150",
                  index < steps.indexOf(step)
                    ? "bg-emerald-400"
                    : step === item
                      ? "bg-brand-cyan"
                      : "bg-slate-800",
                ].join(" ")}
                aria-label={`Step ${index + 1}`}
              />
            ))}
          </div>
        </header>

        {step === "prologue" ? (
          <section key="prologue" className="stagger-fade flex h-full min-h-0 flex-col gap-4">
            <div className="rounded-[28px] border-2 border-brand-pink/50 bg-slate-900 px-5 py-4 text-center shadow-[0_8px_0_rgba(15,23,42,0.76)]">
              <PixelText as="h1" className="text-3xl text-pink-200">
                PROLOGUE
              </PixelText>
              <p className="mt-2 text-xs uppercase tracking-[0.28em] text-brand-cyan">
                Director's new road
              </p>
            </div>

            <Card className="relative min-h-0 flex-1 overflow-hidden border-brand-cyan/40 p-0">
              <img
                src={PROLOGUE_IMAGE_SRC}
                alt="옥상 스튜디오에서 네온 도시를 내려다보는 K-POP 디렉터"
                className="absolute inset-0 h-full w-full object-cover [image-rendering:auto]"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-slate-950/6 via-transparent to-slate-950/92" />

              <div className="absolute inset-x-0 bottom-0 space-y-6 p-4 pb-6">
                <button
                  className="w-full whitespace-normal break-keep px-2 py-1 text-center text-base leading-7 text-slate-50 transition [overflow-wrap:anywhere] [text-shadow:0_2px_0_#0f172a,0_0_14px_rgba(15,23,42,0.95)] hover:text-cyan-100"
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
              </div>
            </Card>
          </section>
        ) : null}

        {step === "investor" ? (
          <section key="investor" className="stagger-fade flex h-full flex-col gap-4">
            <div className="min-h-0 flex-1 flex flex-col">
              <div className="pt-2">
                <PixelText as="h1" className="text-3xl text-slate-50">
                  투자사 선택
                </PixelText>
                <p className="mt-2 text-sm text-slate-400">
                  투자자는 시작 자금과 플레이 압력을 동시에 결정합니다.
                </p>
              </div>

              <div className="relative left-1/2 flex min-h-0 w-screen -translate-x-1/2 flex-1 items-center">
                <div
                  ref={investorScrollerRef}
                  className="flex w-full snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden px-8 py-3 scroll-smooth"
                  onScroll={selectCenteredInvestor}
                >
                {INVESTOR_COMPANIES.map((investor) => {
                  const style = investorStyles[investor.type];
                  const isSelected = selectedInvestor.id === investor.id;

                  return (
                    <article
                      key={investor.id}
                      ref={(node) => {
                        if (node) {
                          investorCardRefs.current.set(investor.id, node);
                        } else {
                          investorCardRefs.current.delete(investor.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className={[
                        "flex min-w-[300px] cursor-pointer snap-center flex-col items-center rounded-[28px] border-2 bg-slate-800 p-4 text-center shadow-[0_10px_0_rgba(15,23,42,0.7)] transition duration-150 ease-out [word-break:keep-all] [overflow-wrap:break-word]",
                        style.color,
                        isSelected
                          ? "border-brand-cyan ring-2 ring-brand-cyan/40"
                          : "opacity-60 hover:border-brand-cyan/70 hover:opacity-100",
                      ].join(" ")}
                      onClick={() => focusInvestorCard(investor)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          focusInvestorCard(investor);
                        }
                      }}
                    >
                      <div className="mb-3 w-1/2 overflow-hidden rounded-xl border-2 border-slate-600/80 bg-slate-950 shadow-[inset_0_0_24px_rgba(15,23,42,0.6)]">
                        <img
                          src={style.logoSrc}
                          alt={`${investor.name} 로고`}
                          className="aspect-square w-full object-cover"
                        />
                      </div>
                      <PixelText as="h2" className="text-xl text-slate-50 [text-shadow:none]">
                        {investor.name}
                      </PixelText>
                      <p className="mt-2 text-sm leading-6 text-slate-100 [text-shadow:0_1px_0_rgba(15,23,42,0.85)]">
                        {investor.description}
                      </p>
                      <MoneyDisplay amount={investor.fundAmount} size="2xl" className="mt-3" />
                      <div className="w-full pt-3">
                        <Button
                          tone="ghost"
                          className="w-full"
                          onClick={(event) => {
                            event.stopPropagation();
                            setDetailInvestor(investor);
                          }}
                        >
                          상세 보기
                        </Button>
                      </div>
                    </article>
                  );
                })}
                </div>
              </div>
            </div>

            <Card className="space-y-3 pb-5 text-center [word-break:keep-all] [overflow-wrap:break-word]">
              <p className="text-xs uppercase tracking-[0.24em] text-brand-cyan">
                Selected
              </p>
              <div
                key={selectedInvestor.id}
                className="animate-label-swap min-h-[5.5rem] space-y-2"
              >
                <PixelText as="h2" className="text-xl text-slate-50 [text-shadow:none]">
                  {selectedInvestor.name}
                </PixelText>
                {conditionSummary.map((condition) => (
                  <p key={condition} className="text-sm text-slate-300">
                    {condition}
                  </p>
                ))}
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-3 pb-2 pt-2">
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
          <section key="group" className="stagger-fade flex h-full min-h-0 flex-col gap-4">
            <div className="min-h-0 flex-1 space-y-4">
              <div className="pt-2">
                <PixelText as="h1" className="text-3xl text-slate-50">
                  그룹 설정
                </PixelText>
                <p className="mt-2 text-sm text-slate-400">
                  첫 프로젝트의 정체성을 정합니다. 이름은 이후 UI에서 교체 가능합니다.
                </p>
              </div>

              <Card className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm text-slate-200">회사명</span>
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <input
                      value={companyName}
                      onChange={(event) => setCompanyName(event.target.value)}
                      className="min-h-11 w-full rounded-2xl border-2 border-slate-600 bg-slate-950 px-4 text-slate-100 outline-none transition focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/30"
                    />
                    <Button
                      tone="secondary"
                      aria-label="회사명 랜덤 생성"
                      onClick={() => setCompanyName(pickRandom(COMPANY_NAME_CANDIDATES))}
                    >
                      랜덤
                    </Button>
                  </div>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm text-slate-200">그룹명</span>
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <input
                      value={groupName}
                      onChange={(event) => setGroupName(event.target.value)}
                      className="min-h-11 w-full rounded-2xl border-2 border-slate-600 bg-slate-950 px-4 text-slate-100 outline-none transition focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/30"
                    />
                    <Button
                      tone="secondary"
                      aria-label="그룹명 랜덤 생성"
                      onClick={() => setGroupName(pickRandom(GROUP_NAME_CANDIDATES))}
                    >
                      랜덤
                    </Button>
                  </div>
                </label>
              </Card>

              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    value: "female" as GroupGender,
                    label: "여자 그룹",
                    icon: "♀",
                    iconColor: "text-pink-300",
                  },
                  {
                    value: "male" as GroupGender,
                    label: "남자 그룹",
                    icon: "♂",
                    iconColor: "text-sky-300",
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    className={[
                      "min-h-36 rounded-[28px] border-2 p-4 text-center shadow-[0_8px_0_rgba(15,23,42,0.7)] transition duration-150 ease-out active:scale-[0.96]",
                      radioTileClasses(groupGender === option.value, true),
                    ].join(" ")}
                    onClick={() => setGroupGender(option.value)}
                  >
                    <PixelText as="p" className={["text-4xl", option.iconColor].join(" ")}>
                      {option.icon}
                    </PixelText>
                    <p className="mt-4 text-slate-50">{option.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-auto grid grid-cols-2 gap-3 pb-2 pt-2">
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
          <div className="space-y-5 text-center text-sm leading-6 [word-break:keep-all] [overflow-wrap:break-word]">
            <div>
              <p className="text-slate-100">조건 전문</p>
              <ul className="mt-2 space-y-2 text-slate-300">
                {detailInvestor.conditions.map((condition) => (
                  <li key={condition.id}>{condition.description}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-red-300">약속을 지키지 못하면</p>
              <ul className="mt-2 space-y-2 text-red-200">
                {detailInvestor.penaltyEffects.map((effect) => (
                  <li key={effect.type}>{effect.description}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-emerald-300">달성 보너스</p>
              <ul className="mt-2 space-y-2 text-emerald-200">
                {detailInvestor.bonusEffects.map((effect) => (
                  <li key={effect.type}>{effect.description}</li>
                ))}
              </ul>
            </div>
            <p className="rounded-2xl border border-slate-600 bg-slate-950 p-4 text-slate-300">
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
          <p className="text-center text-sm leading-6 text-slate-300 [word-break:keep-all] [overflow-wrap:break-word]">
            이 투자사를 선택하면 게임 플레이스타일이{" "}
            <span className="text-brand-cyan">
              {describePlaystyle(confirmInvestor)}
            </span>
            에 맞춰집니다.
          </p>
        </Modal>
      ) : null}
    </main>
  );
}
