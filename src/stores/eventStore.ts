import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import type { EventStore, EventStoreState } from "@/types/game";

export const initialEventState: EventStoreState = {
  pendingEvents: [
    {
      id: "event-debut-rush",
      type: "training",
      title: "Debut Preparation Crunch",
      description: "The team is behind on choreography and morale is slipping.",
      choices: [
        {
          label: "Extend rehearsal hours",
          description: "Push through the delay with overtime.",
          tradeoff: "Condition drops and stress spikes.",
          effects: { albumChoreography: 6, stress: 5, condition: -4 },
        },
        {
          label: "Delay the milestone",
          description: "Protect the team, but lose some momentum.",
          tradeoff: "Public attention softens and investors get nervous.",
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
