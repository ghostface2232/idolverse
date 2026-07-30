interface AlertProps {
  message: string;
  tone?: "danger" | "warning";
  className?: string;
}

/** 저장 실패 등 화면 상단에 띄우는 공용 경고 배너. */
export function Alert({ message, tone = "danger", className = "" }: AlertProps) {
  const toneClass =
    tone === "danger"
      ? "bg-state-danger/12 text-rose-200"
      : "bg-state-warning/12 text-amber-200";

  return (
    <p
      role="alert"
      className={`rounded-xl px-3 py-2 text-sm [word-break:keep-all] ${toneClass} ${className}`.trim()}
    >
      {message}
    </p>
  );
}
