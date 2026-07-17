import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import type { Album, AlbumStore, AlbumStoreState } from "@/types/game";

const initialAlbum: Album = {
  id: "album-aurora-001",
  title: "First Light",
  concept: {
    genre: "dancePop",
    mood: "refreshing",
  },
  // 신인 세계관의 데모 밴드(50대). 완성곡급 후보는 성장한 프로듀서와
  // 함께 컴백 사이클에서 온다.
  titleTrackCandidates: [
    {
      id: "track-safe",
      name: "Sparkline",
      type: "safe",
      quality: 56,
      description: "Reliable debut hook with broad appeal.",
    },
    {
      id: "track-bold",
      name: "Neon Current",
      type: "bold",
      quality: 63,
      description: "Sharper concept identity with higher execution risk.",
    },
    {
      id: "track-global",
      name: "Summer Dial",
      type: "global",
      quality: 59,
      description: "English-heavy topline built for global short-form clips.",
    },
  ],
  titleTrack: null,
  // 데뷔 일정(16~24주)의 트레이드오프가 살려면 시작 진행도가 낮아야 한다 —
  // 빠른 데뷔는 진행도가 덜 찬 채로, 긴 일정은 꽉 채운 채로 발매된다.
  progress: {
    song: 20,
    visual: 12,
    choreography: 16,
    marketing: 8,
  },
  memberConceptFit: 71,
  seasonFit: 82,
  fandomExpectationFit: 67,
  externalCollaborators: {
    composer: false,
    choreographer: true,
  },
  quality: 0,
};

export const initialAlbumState: AlbumStoreState = {
  currentAlbum: initialAlbum,
  releasedAlbums: [],
  conceptHistory: [],
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

export const albumVanillaStore = createStore<AlbumStore>()((set) => ({
  ...initialAlbumState,
  startAlbum: (album) =>
    set(() => ({
      currentAlbum: {
        ...album,
        quality: album.quality ?? 0,
      },
    })),
  updateProgress: (progress) =>
    set((state) => ({
      currentAlbum: state.currentAlbum
        ? {
            ...state.currentAlbum,
            progress: {
              ...state.currentAlbum.progress,
              ...Object.fromEntries(
                Object.entries(progress).map(([key, value]) => [
                  key,
                  clamp(value ?? state.currentAlbum!.progress[key as keyof Album["progress"]], 0, 100),
                ]),
              ),
            },
          }
        : null,
    })),
  selectTitleTrack: (trackId) =>
    set((state) => ({
      currentAlbum: state.currentAlbum
        ? {
            ...state.currentAlbum,
            titleTrack:
              state.currentAlbum.titleTrackCandidates.find(
                (track) => track.id === trackId,
              ) ?? null,
          }
        : null,
    })),
  releaseAlbum: (releasedAlbum) =>
    set((state) => {
      if (!state.currentAlbum) {
        return state;
      }

      return {
        currentAlbum: null,
        releasedAlbums: [...state.releasedAlbums, releasedAlbum],
        conceptHistory: [...state.conceptHistory, releasedAlbum.concept.mood],
      };
    }),
  addToHistory: (mood) =>
    set((state) => ({
      conceptHistory: [...state.conceptHistory, mood],
    })),
}));

export const useAlbumStore = <T>(selector: (state: AlbumStore) => T) =>
  useStore(albumVanillaStore, selector);
