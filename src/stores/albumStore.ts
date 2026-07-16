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
  titleTrackCandidates: [
    {
      id: "track-safe",
      name: "Sparkline",
      type: "safe",
      quality: 72,
      description: "Reliable debut hook with broad appeal.",
    },
    {
      id: "track-bold",
      name: "Neon Current",
      type: "bold",
      quality: 78,
      description: "Sharper concept identity with higher execution risk.",
    },
    {
      id: "track-global",
      name: "Summer Dial",
      type: "global",
      quality: 75,
      description: "English-heavy topline built for global short-form clips.",
    },
  ],
  titleTrack: null,
  progress: {
    song: 48,
    visual: 33,
    choreography: 39,
    marketing: 27,
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
