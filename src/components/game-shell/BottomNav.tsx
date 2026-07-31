import type { ReactNode } from "react";
import {
  CalendarRange,
  House,
  SlidersHorizontal,
  TrendingUp,
  Users,
} from "lucide-react";
import { Tab, TabList, TabPanel, Tabs } from "react-aria-components";

const NAV_ITEMS = [
  { key: "company", label: "홈", icon: House, primary: false },
  { key: "members", label: "멤버", icon: Users, primary: false },
  { key: "week", label: "이번 주", icon: CalendarRange, primary: true },
  { key: "market", label: "시장", icon: TrendingUp, primary: false },
  { key: "more", label: "경영", icon: SlidersHorizontal, primary: false },
] as const;

export type GameSection = (typeof NAV_ITEMS)[number]["key"];

interface BottomNavProps {
  selectedKey: GameSection;
  onSelectionChange: (key: GameSection) => void;
  weekBadge?: number;
  children: ReactNode;
}

export function BottomNav({
  selectedKey,
  onSelectionChange,
  weekBadge = 0,
  children,
}: BottomNavProps) {
  return (
    <Tabs
      aria-label="게임 메뉴"
      selectedKey={selectedKey}
      onSelectionChange={(key) => onSelectionChange(key as GameSection)}
      className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] lg:grid-cols-[88px_minmax(0,1fr)] lg:grid-rows-1"
    >
      <TabList
        items={NAV_ITEMS}
        className="order-2 grid grid-cols-5 bg-surface-panel/96 shadow-[var(--shadow-dock)] backdrop-blur-xl lg:order-1 lg:flex lg:flex-col lg:border-r lg:border-white/8 lg:shadow-none"
      >
        {(item) => {
          const Icon = item.icon;

          return (
            <Tab
              id={item.key}
              className={({ isFocusVisible, isSelected, isPressed }) =>
                [
                  "group relative flex min-h-[4.25rem] min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium outline-none",
                  "transition-[scale,color] duration-[var(--motion-state)] ease-out",
                  isSelected
                    ? item.primary
                      ? "text-pink-100"
                      : "text-action-secondary"
                    : "text-text-muted hover:text-text-secondary",
                  isPressed ? "scale-[0.96]" : "scale-100",
                  isFocusVisible ? "ring-2 ring-inset ring-action-secondary" : "",
                  isSelected ? "font-semibold" : "",
                  "lg:min-h-20 lg:w-full",
                ].join(" ")
              }
            >
              {({ isSelected }) => (
                <>
                  <span
                    className={[
                      "relative grid place-items-center rounded-full",
                      "transition-[background-color,box-shadow] duration-[var(--motion-state)] ease-out",
                      item.primary ? "h-9 w-14" : "h-8 w-12",
                      isSelected && item.primary
                        ? "bg-action-primary text-white shadow-[0_6px_20px_rgba(236,72,153,0.32)]"
                        : isSelected
                          ? "bg-action-secondary/15"
                          : "bg-transparent group-hover:bg-white/[0.05]",
                    ].join(" ")}
                  >
                    <Icon
                      className={item.primary ? "size-[21px]" : "size-5"}
                      strokeWidth={isSelected ? 2.1 : 1.8}
                      aria-hidden="true"
                    />
                    {item.key === "week" && weekBadge > 0 ? (
                      <span
                        className="absolute -right-0.5 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-state-warning px-1 text-[9px] font-bold leading-none text-slate-950 shadow-[0_0_0_2px_var(--color-surface-panel)]"
                        aria-hidden="true"
                      >
                        {weekBadge > 9 ? "9+" : weekBadge}
                      </span>
                    ) : null}
                  </span>
                  <span className="truncate">{item.label}</span>
                  {isSelected ? (
                    <span
                      className={[
                        "absolute bottom-1 h-0.5 w-4 rounded-full",
                        item.primary ? "bg-action-primary" : "bg-action-secondary",
                      ].join(" ")}
                      aria-hidden="true"
                    />
                  ) : null}
                </>
              )}
            </Tab>
          );
        }}
      </TabList>
      <TabPanel
        id={selectedKey}
        className="order-1 min-h-0 overflow-hidden outline-none lg:order-2"
      >
        {children}
      </TabPanel>
    </Tabs>
  );
}
