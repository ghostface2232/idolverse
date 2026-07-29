import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import type { EventStore, EventStoreState } from "@/types/game";

export const initialEventState: EventStoreState = {
  pendingEvents: [
    {
      id: "event-debut-rush",
      type: "training",
      title: "데뷔 준비 비상",
      description: "안무 진도가 계획보다 밀려 있습니다. 연습실 분위기도 눈에 띄게 가라앉았습니다.",
      choices: [
        {
          label: "연습 시간 연장",
          description: "야간 연습을 붙여서라도 밀린 진도를 따라잡습니다.",
          tradeoff: "멤버들 컨디션이 떨어지고 스트레스가 급격히 쌓입니다.",
          effects: { albumChoreography: 6, stress: 5, condition: -4 },
        },
        {
          label: "일정 조정",
          description: "멤버들을 보호하는 대신 데뷔 준비 흐름을 한 박자 늦춥니다.",
          tradeoff: "대중의 관심이 식고 투자자들이 불안해합니다.",
          effects: { condition: 5, public: -3, investorPressure: 2 },
        },
      ],
      resolved: false,
    },
  ],
  activeInterludeActivities: [],
};

export const eventVanillaStore = createStore<EventStore>()((set) => ({
  ...initialEventState,
  addEvent: (event) =>
    set((state) => ({
      pendingEvents: [...state.pendingEvents, event],
    })),
  resolveEvent: (eventId) =>
    set((state) => ({
      pendingEvents: state.pendingEvents.map((event) =>
        event.id === eventId
          ? {
              ...event,
              resolved: true,
              resolvedChoiceIndex: null,
            }
          : event,
      ),
    })),
  startInterlude: (activity) =>
    set((state) => ({
      activeInterludeActivities: [...state.activeInterludeActivities, activity],
    })),
  endInterlude: (type, targetMemberId) =>
    set((state) => ({
      activeInterludeActivities: state.activeInterludeActivities.filter(
        (activity) =>
          activity.type !== type || activity.targetMemberId !== targetMemberId,
      ),
    })),
}));

export const useEventStore = <T>(selector: (state: EventStore) => T) =>
  useStore(eventVanillaStore, selector);
