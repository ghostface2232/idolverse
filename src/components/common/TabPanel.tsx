import type { ReactNode } from "react";
import { PanelHeader } from "@/components/common/PanelHeader";

interface TabPanelProps {
  title: string;
  onBack: () => void;
  children: ReactNode;
}

export function TabPanel({ title, onBack, children }: TabPanelProps) {
  return (
    <div className="absolute inset-0 flex flex-col bg-slate-950">
      <PanelHeader title={title} onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
    </div>
  );
}
