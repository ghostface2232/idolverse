import { CONCEPTS } from "@/data/concepts";
import type { AlbumStoreState } from "@/types/game";

export const initialAlbumState: AlbumStoreState = {
  activeConcept: CONCEPTS[0],
  releaseReadiness: 41,
};

