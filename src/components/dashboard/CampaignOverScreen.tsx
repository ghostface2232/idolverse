import { Button } from "@/components/common/Button";
import type { CampaignFailure } from "@/types/game";

interface CampaignOverScreenProps {
  failure: CampaignFailure;
  groupName: string;
  releasedAlbumCount: number;
  awardCount: number;
  fandom: number;
  onExit: () => void;
}

/**
 * 캠페인 종료 화면. 위기 카드와 카운트다운 경고가 먼저 오고 여기서 끝난다 —
 * 세이브는 남지만 주는 더 진행되지 않는다.
 */
export function CampaignOverScreen({
  failure,
  groupName,
  releasedAlbumCount,
  awardCount,
  fandom,
  onExit,
}: CampaignOverScreenProps) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/92 px-6 backdrop-blur-sm">
      <div className="w-full max-w-sm space-y-5 text-center [word-break:keep-all] [overflow-wrap:break-word]">
        <p className="text-xs uppercase tracking-[0.3em] text-rose-300">
          Campaign Over
        </p>
        <h1 className="text-xl font-bold text-slate-50">
          투자사가 자금 회수를 결정했습니다
        </h1>
        <p className="text-sm leading-6 text-slate-300">
          {groupName}의 여정이 {failure.year}년차 {failure.week}주차에
          멈췄습니다. 회사는 정리 절차에 들어갑니다.
        </p>

        <div className="rounded-2xl bg-white/[0.04] p-4 text-sm shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
            남긴 기록
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2 tabular-nums">
            <div>
              <p className="text-lg font-semibold text-slate-100">
                {releasedAlbumCount}
              </p>
              <p className="text-[11px] text-slate-400">발매 앨범</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-100">{awardCount}</p>
              <p className="text-[11px] text-slate-400">수상</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-100">
                {Math.round(fandom)}
              </p>
              <p className="text-[11px] text-slate-400">팬덤</p>
            </div>
          </div>
        </div>

        <Button className="w-full" onClick={onExit}>
          메인 메뉴로
        </Button>
      </div>
    </div>
  );
}
