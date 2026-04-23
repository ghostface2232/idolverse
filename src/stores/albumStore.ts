import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import type { Album, AlbumStore, AlbumStoreState } from "@/types/game";

const initialAlbum: Album = {
  id: "album-aurora-001",
  title: "First Light",
  concept: {
    genre: "dance",
    mood: "fresh",
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

const initialAlbumState: AlbumStoreState = {
  currentAlbum: initialAlbum,
  releasedAlbums: [],
  conceptHistory: [],
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

function calculateAlbumQuality(album: Album) {
  const progressAverage =
    (album.progress.song +
      album.progress.visual +
      album.progress.choreography +
      album.progress.marketing) /
    4;
  const titleTrackQuality = album.titleTrack?.quality ?? 0;
  const fitAverage =
    (album.memberConceptFit + album.seasonFit + album.fandomExpectationFit) / 3;
  const collaboratorBonus =
    (album.externalCollaborators.composer ? 4 : 0) +
    (album.externalCollaborators.choreographer ? 3 : 0);

  return clamp(
    Math.round(progressAverage * 0.45 + titleTrackQuality * 0.35 + fitAverage * 0.2) +
      collaboratorBonus,
    0,
    100,
  );
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
  releaseAlbum: (releaseWeek) =>
    set((state) => {
      if (!state.currentAlbum) {
        return state;
      }

      const quality = calculateAlbumQuality(state.currentAlbum);
      const releasedAlbum: Album = {
        ...state.currentAlbum,
        quality,
        releaseWeek,
        performance: {
          chartPeak: Math.max(1, 101 - quality),
          firstWeekSales: quality * 4200,
          totalStreams: quality * 135000,
          fanGrowth: Math.round(quality * 0.7),
        },
      };

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
