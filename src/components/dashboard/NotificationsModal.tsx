import { Modal } from "@/components/common/Modal";
import { NEWS_TYPE_LABELS } from "@/data/kpopCalendar";
import type { KPopNews, Notification } from "@/types/game";

interface NotificationsModalProps {
  open: boolean;
  onClose: () => void;
  news: KPopNews[];
  notifications: Notification[];
}

const TYPE_TONE: Record<Notification["type"], string> = {
  info: "border-state-info/50 bg-state-info/10",
  success: "border-state-success/50 bg-state-success/10",
  warning: "border-state-warning/50 bg-state-warning/10",
  error: "border-state-danger/50 bg-state-danger/10",
};

const TYPE_TITLE_TONE: Record<Notification["type"], string> = {
  info: "text-state-info",
  success: "text-state-success",
  warning: "text-state-warning",
  error: "text-state-danger",
};

export function NotificationsModal({
  open,
  onClose,
  news,
  notifications,
}: NotificationsModalProps) {
  if (!open) {
    return null;
  }

  return (
    <Modal title="알림 / 뉴스" onClose={onClose}>
      <div className="space-y-5">
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.22em] text-brand-pink">
              K-POP 뉴스피드
            </p>
            {news.length > 0 ? (
              <span className="rounded-full bg-brand-pink/12 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-brand-pink">
                {news.length}건
              </span>
            ) : null}
          </div>
          {news.length === 0 ? (
            <p className="text-xs text-text-muted">
              아직 도착한 업계 소식이 없습니다.
            </p>
          ) : (
            <div className="space-y-2">
              {news.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-white/8 bg-surface-raised/70 p-3"
                >
                  <p className="text-[10px] uppercase tracking-[0.18em] text-brand-cyan">
                    {NEWS_TYPE_LABELS[item.type]}
                  </p>
                  <h3 className="mt-2 text-sm text-text-primary [word-break:keep-all]">
                    {item.headline}
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-text-muted [word-break:keep-all]">
                    {item.detail}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-2 border-t border-white/8 pt-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.22em] text-brand-cyan">
              알림
            </p>
            {notifications.length > 0 ? (
              <span className="rounded-full bg-brand-cyan/12 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-brand-cyan">
                {notifications.length}건
              </span>
            ) : null}
          </div>
          {notifications.length === 0 ? (
            <p className="text-xs text-text-muted">새 알림이 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={[
                    "rounded-2xl border px-3 py-2",
                    TYPE_TONE[notification.type],
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={[
                        "text-xs font-semibold [word-break:keep-all]",
                        TYPE_TITLE_TONE[notification.type],
                      ].join(" ")}
                    >
                      {notification.title}
                    </p>
                    <span className="shrink-0 text-[10px] tabular-nums text-text-muted">
                      {notification.week}주차
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-text-secondary [word-break:keep-all]">
                    {notification.message}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Modal>
  );
}
