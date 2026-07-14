import type { ReactNode } from "react";
import {
  Building2,
  CalendarRange,
  Ellipsis,
  TrendingUp,
  Users,
} from "lucide-react";
import { Tab, TabList, TabPanel, Tabs } from "react-aria-components";

const NAV_ITEMS = [
  { key: "company", label: "회사", icon: Building2 },
  { key: "week", label: "이번 주", icon: CalendarRange },
  { key: "members", label: "멤버", icon: Users },
  { key: "market", label: "시장", icon: TrendingUp },
  { key: "more", label: "더보기", icon: Ellipsis },
] as const;

export type GameSection = (typeof NAV_ITEMS)[number]["key"];

interface BottomNavProps {
  selectedKey: GameSection;
  onSelectionChange: (key: GameSection) => void;
  children: ReactNode;
}

export function BottomNav({
  selectedKey,
  onSelectionChange,
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
        className="order-2 grid grid-cols-5 border-t border-white/8 bg-surface-panel lg:order-1 lg:flex lg:flex-col lg:border-r lg:border-t-0"
      >
        {(item) => {
          const Icon = item.icon;

          return (
            <Tab
              id={item.key}
              className={({ isFocusVisible, isSelected, isPressed }) =>
                [
                  "relative flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-medium outline-none",
                  "transition-[scale,color,background-color] duration-[var(--motion-state)] ease-out",
                  isSelected
                    ? "bg-action-secondary/[0.08] text-action-secondary after:absolute after:inset-x-3 after:top-0 after:h-0.5 after:rounded-full after:bg-action-secondary lg:after:inset-y-3 lg:after:left-0 lg:after:right-auto lg:after:h-auto lg:after:w-0.5"
                    : "text-text-muted hover:bg-white/[0.04] hover:text-text-secondary",
                  isPressed ? "scale-[0.96]" : "scale-100",
                  isFocusVisible ? "ring-2 ring-inset ring-action-secondary" : "",
                  "lg:min-h-20 lg:w-full",
                ].join(" ")
              }
            >
              <Icon className="size-5" strokeWidth={1.8} aria-hidden="true" />
              <span className="truncate">{item.label}</span>
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
