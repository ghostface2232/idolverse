import { Modal } from "@/components/common/Modal";
import { NEWS_TYPE_LABELS } from "@/components/dashboard/MarketOverviewModal";
import type { KPopNews, Notification } from "@/types/game";

interface NotificationsModalProps {
  open: boolean;
  onClose: () => void;
  news: KPopNews[];
  notifications: Notification[];
}

const TYPE_TONE: Record<Notification["type"], string> = {
  info: "border-cyan-300/50 bg-cyan-400/10 text-cyan-100",
  success: "border-emerald-300/50 bg-emerald-400/10 text-emerald-100",
  warning: "border-amber-300/50 bg-amber-400/10 text-amber-100",
  error: "border-red-300/50 bg-red-400/10 text-red-100",
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
          <p className="text-xs uppercase tracking-[0.22em] text-brand-pink">
            K-POP 뉴스피드
          </p>
          {news.length === 0 ? (
            <p className="text-xs text-slate-500">
              아직 도착한 업계 소식이 없습니다.
            </p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {news.map((item) => (
                <article
                  key={item.id}
                  className="min-w-[240px] rounded-2xl border border-white/8 bg-slate-800/70 p-3"
                >
                  <p className="text-[10px] uppercase tracking-[0.18em] text-brand-cyan">
                    {NEWS_TYPE_LABELS[item.type]}
                  </p>
                  <h3 className="mt-2 text-sm text-slate-100">
                    {item.headline}
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    {item.detail}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-2">
          <p className="text-xs uppercase tracking-[0.22em] text-brand-cyan">
            알림
          </p>
          {notifications.length === 0 ? (
            <p className="text-xs text-slate-500">새 알림이 없습니다.</p>
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
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold">
                      {notification.title}
                    </p>
                    <span className="text-[10px] text-slate-300">
                      {notification.week}주차
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-200/90">
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
