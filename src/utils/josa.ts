const JOSA_PAIRS = {
  "이/가": ["이", "가"],
  "은/는": ["은", "는"],
  "을/를": ["을", "를"],
  "과/와": ["과", "와"],
  "으로/로": ["으로", "로"],
  "이나/나": ["이나", "나"],
  "이랑/랑": ["이랑", "랑"],
  "이라/라": ["이라", "라"],
  "이란/란": ["이란", "란"],
  "이에게/에게": ["이에게", "에게"],
  "이의/의": ["이의", "의"],
} as const;

export type JosaPair = keyof typeof JOSA_PAIRS;

const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;

// 숫자·영문으로 끝나는 이름도 한국어 발음 기준으로 받침 여부를 판정한다.
const FINAL_DIGIT_HAS_BATCHIM: Record<string, boolean> = {
  "0": true, // 영
  "1": true, // 일
  "2": false, // 이
  "3": true, // 삼
  "4": false, // 사
  "5": false, // 오
  "6": true, // 육
  "7": true, // 칠
  "8": true, // 팔
  "9": false, // 구
};

// l/m/n은 단어식(걸/팀/원)·알파벳식(엘/엠/엔) 발음 모두 받침으로 끝난다.
const FINAL_LATIN_HAS_BATCHIM = new Set(["l", "m", "n"]);

function hasBatchim(word: string): boolean | null {
  const trimmed = word.trimEnd();
  if (!trimmed) return null;
  const last = trimmed[trimmed.length - 1];
  const code = last.charCodeAt(0);
  if (code >= HANGUL_START && code <= HANGUL_END) {
    return (code - HANGUL_START) % 28 !== 0;
  }
  if (last in FINAL_DIGIT_HAS_BATCHIM) {
    return FINAL_DIGIT_HAS_BATCHIM[last];
  }
  if (/[a-zA-Z]/.test(last)) {
    return FINAL_LATIN_HAS_BATCHIM.has(last.toLowerCase());
  }
  return null;
}

/** 앞말의 받침 유무에 맞는 조사를 돌려준다. 판정 불가 시 "이(가)" 형태로 병기한다. */
export function josa(word: string, pair: JosaPair): string {
  const [withBatchim, withoutBatchim] = JOSA_PAIRS[pair];
  const batchim = hasBatchim(word);
  if (batchim === null) {
    return `${withBatchim}(${withoutBatchim})`;
  }
  if (pair === "으로/로" && batchim) {
    // ㄹ 받침은 "로"를 쓴다 (예: 서울로).
    const code = word.trimEnd().charCodeAt(word.trimEnd().length - 1);
    if (code >= HANGUL_START && code <= HANGUL_END && (code - HANGUL_START) % 28 === 8) {
      return withoutBatchim;
    }
  }
  return batchim ? withBatchim : withoutBatchim;
}

/** 단어에 조사를 붙여 돌려준다. 예: withJosa("하린", "이/가") === "하린이" */
export function withJosa(word: string, pair: JosaPair): string {
  return `${word}${josa(word, pair)}`;
}
