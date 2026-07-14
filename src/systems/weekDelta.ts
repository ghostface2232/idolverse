import type {
  Album,
  FandomStoreState,
  Trainee,
  WeekDelta,
  WeekDeltaSeverity,
  WeekDeltaSource,
  WeekDeltaTarget,
  WeekDeltaValue,
} from "@/types/game";

export interface WeekDeltaState {
  money: number;
  fandom: Pick<
    FandomStoreState,
    | "public"
    | "fandom"
    | "fandomLoyalty"
    | "fandomDisappointment"
    | "global"
    | "industry"
  >;
  trainees: Trainee[];
  album: Album | null;
  investorPressureWeeks: number;
}

interface DiffOptions {
  source: WeekDeltaSource;
  day: WeekDelta["day"];
  idPrefix: string;
  startIndex?: number;
}

const TRAINEE_FIELDS = [
  "condition",
  "stress",
  "satisfaction",
  "mood",
  "injuryWeeks",
  "currentActivity",
] as const;

const FANDOM_FIELDS = [
  "public",
  "fandom",
  "fandomLoyalty",
  "fandomDisappointment",
  "global",
  "industry",
] as const;

const ALBUM_PROGRESS_FIELDS = ["song", "visual", "choreography", "marketing"] as const;

export function captureWeekDeltaState(state: WeekDeltaState): WeekDeltaState {
  return structuredClone(state);
}

export function diffWeekDeltaState(
  before: WeekDeltaState,
  after: WeekDeltaState,
  options: DiffOptions,
): WeekDelta[] {
  const candidates: Array<{
    target: WeekDeltaTarget;
    before: WeekDeltaValue;
    after: WeekDeltaValue;
  }> = [];

  addCandidate(candidates, financeTarget("money", "자금"), before.money, after.money);
  addCandidate(
    candidates,
    gameTarget("investorPressureWeeks", "투자사 압박"),
    before.investorPressureWeeks,
    after.investorPressureWeeks,
  );

  for (const field of FANDOM_FIELDS) {
    addCandidate(
      candidates,
      fandomTarget(field, fandomLabel(field)),
      before.fandom[field],
      after.fandom[field],
    );
  }

  const beforeTrainees = new Map(before.trainees.map((trainee) => [trainee.id, trainee]));
  for (const trainee of after.trainees) {
    const previous = beforeTrainees.get(trainee.id);
    if (!previous) continue;

    for (const field of TRAINEE_FIELDS) {
      addCandidate(
        candidates,
        traineeTarget(trainee, field, traineeFieldLabel(field)),
        previous[field],
        trainee[field],
      );
    }

    for (const field of Object.keys(trainee.stats) as Array<keyof Trainee["stats"]>) {
      addCandidate(
        candidates,
        traineeTarget(trainee, `stats.${field}`, statLabel(field)),
        previous.stats[field],
        trainee.stats[field],
      );
    }

    const chemistryIds = new Set([
      ...Object.keys(previous.chemistry),
      ...Object.keys(trainee.chemistry),
    ]);
    for (const targetId of chemistryIds) {
      addCandidate(
        candidates,
        traineeTarget(trainee, `chemistry.${targetId}`, "케미"),
        previous.chemistry[targetId] ?? 0,
        trainee.chemistry[targetId] ?? 0,
      );
    }
  }

  if (before.album && after.album && before.album.id === after.album.id) {
    for (const field of ALBUM_PROGRESS_FIELDS) {
      addCandidate(
        candidates,
        albumTarget(after.album, `progress.${field}`, albumProgressLabel(field)),
        before.album.progress[field],
        after.album.progress[field],
      );
    }
    addCandidate(
      candidates,
      albumTarget(after.album, "quality", "앨범 품질"),
      before.album.quality,
      after.album.quality,
    );
  }

  const startIndex = options.startIndex ?? 0;
  return candidates.map((candidate, index) => ({
    id: `${options.idPrefix}-${startIndex + index}`,
    source: options.source,
    target: candidate.target,
    before: candidate.before,
    after: candidate.after,
    day: options.day,
    severity: classifySeverity(candidate.target, candidate.before, candidate.after),
  }));
}

function addCandidate(
  candidates: Array<{
    target: WeekDeltaTarget;
    before: WeekDeltaValue;
    after: WeekDeltaValue;
  }>,
  target: WeekDeltaTarget,
  before: WeekDeltaValue,
  after: WeekDeltaValue,
) {
  if (Object.is(before, after)) return;
  candidates.push({ target, before, after });
}

function classifySeverity(
  target: WeekDeltaTarget,
  before: WeekDeltaValue,
  after: WeekDeltaValue,
): WeekDeltaSeverity {
  if (typeof before !== "number" || typeof after !== "number") return "info";

  if (
    (target.field === "condition" || target.field === "satisfaction") &&
    after <= 20
  ) {
    return "critical";
  }
  if (target.field === "stress" && after >= 90) return "critical";
  if (target.kind === "finance" && after < 0) return "critical";

  const magnitude = Math.abs(after - before);
  if (target.kind === "finance") {
    const ratio = magnitude / Math.max(Math.abs(before), 1);
    if (ratio >= 0.2) return "warning";
    if (ratio >= 0.05) return "notice";
    return "info";
  }
  if (magnitude >= 20) return "warning";
  if (magnitude >= 5) return "notice";
  return "info";
}

function financeTarget(field: string, label: string): WeekDeltaTarget {
  return { kind: "finance", id: null, field, label };
}

function gameTarget(field: string, label: string): WeekDeltaTarget {
  return { kind: "game", id: null, field, label };
}

function fandomTarget(field: string, label: string): WeekDeltaTarget {
  return { kind: "fandom", id: null, field, label };
}

function traineeTarget(trainee: Trainee, field: string, label: string): WeekDeltaTarget {
  return { kind: "trainee", id: trainee.id, field, label: `${trainee.name} ${label}` };
}

function albumTarget(album: Album, field: string, label: string): WeekDeltaTarget {
  return { kind: "album", id: album.id, field, label };
}

function fandomLabel(field: (typeof FANDOM_FIELDS)[number]): string {
  return {
    public: "대중 인지도",
    fandom: "코어 팬덤",
    fandomLoyalty: "팬덤 충성도",
    fandomDisappointment: "팬 실망도",
    global: "해외 팬덤",
    industry: "업계 평판",
  }[field];
}

function traineeFieldLabel(field: (typeof TRAINEE_FIELDS)[number]): string {
  return {
    condition: "컨디션",
    stress: "스트레스",
    satisfaction: "만족도",
    mood: "기분",
    injuryWeeks: "부상 기간",
    currentActivity: "현재 활동",
  }[field];
}

function statLabel(field: keyof Trainee["stats"]): string {
  return {
    visual: "비주얼",
    vocal: "보컬",
    dance: "댄스",
    charm: "매력",
    stamina: "체력",
    mental: "멘탈",
  }[field];
}

function albumProgressLabel(field: (typeof ALBUM_PROGRESS_FIELDS)[number]): string {
  return {
    song: "곡 진행도",
    visual: "비주얼 진행도",
    choreography: "안무 진행도",
    marketing: "마케팅 진행도",
  }[field];
}
