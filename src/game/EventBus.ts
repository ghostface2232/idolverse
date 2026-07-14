export type WorldSelection =
  | { kind: "trainee"; id: string }
  | { kind: "facility"; id: string }
  | { kind: "room"; id: string };

export interface PresentationEvents {
  bootComplete: { sceneKey: string };
  sceneReady: { sceneKey: string };
  playWeekTimeline: { resolutionId: string | null };
  skipPlayback: { resolutionId: string | null };
  focusEntity: WorldSelection;
  worldSelectionChanged: WorldSelection | null;
  playReaction: {
    entityId: string;
    reaction: "success" | "warning" | "conflict";
  };
}

type PresentationEventHandler<TPayload> = (payload: TPayload) => void;

class TypedPresentationBus<TEvents extends object> {
  private listeners = new Map<
    keyof TEvents,
    Set<PresentationEventHandler<unknown>>
  >();

  on<TKey extends keyof TEvents>(
    event: TKey,
    handler: PresentationEventHandler<TEvents[TKey]>,
  ) {
    const handlers =
      this.listeners.get(event) ?? new Set<PresentationEventHandler<unknown>>();
    handlers.add(handler as PresentationEventHandler<unknown>);
    this.listeners.set(event, handlers);

    return () => {
      handlers.delete(handler as PresentationEventHandler<unknown>);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  emit<TKey extends keyof TEvents>(event: TKey, payload: TEvents[TKey]) {
    this.listeners.get(event)?.forEach((handler) => handler(payload));
  }
}

/**
 * 일회성 표현 명령만 전달한다. 영속 게임 상태는 Zustand projection을 통해
 * 전달하며, 이 모듈은 초기 메뉴 번들에 Phaser를 끌어오지 않는다.
 */
export const presentationBus = new TypedPresentationBus<PresentationEvents>();
