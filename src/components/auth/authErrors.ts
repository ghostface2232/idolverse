// Supabase가 영어 원문 메시지를 던지므로, 대표 케이스만 한국어로 매핑한다.
const ERROR_PATTERNS: Array<[RegExp, string]> = [
  [/invalid login credentials/i, "이메일 또는 비밀번호가 올바르지 않습니다."],
  [/email not confirmed/i, "이메일 인증이 완료되지 않았습니다. 받은 편지함을 확인해 주세요."],
  [/user already registered/i, "이미 가입된 이메일입니다. 로그인해 주세요."],
  [/rate limit|too many requests/i, "요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요."],
  [/network|fetch/i, "네트워크 연결을 확인한 뒤 다시 시도해 주세요."],
  [/at least 6 characters|password should be/i, "비밀번호는 6자 이상이어야 합니다."],
  [/invalid email|unable to validate email/i, "이메일 형식이 올바르지 않습니다."],
];

export function translateAuthError(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    for (const [pattern, message] of ERROR_PATTERNS) {
      if (pattern.test(error.message)) {
        return message;
      }
    }
  }
  return fallback;
}
