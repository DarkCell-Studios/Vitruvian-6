import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CameraMode = "cinematic" | "orthographic" | "top-down";

type PlanetIdentifier = "earth" | "moon" | "mars" | null;

type OverlayIdentifier = string | null;

type PoiIdentifier = string | null;

interface PlanetStoreState {
  currentPlanet: PlanetIdentifier;
  selectedOverlayId: OverlayIdentifier;
  time: number;
  selectedPoiId: PoiIdentifier;
  cameraMode: CameraMode;
  audioEnabled: boolean;
  setCurrentPlanet: (planet: PlanetIdentifier) => void;
  setOverlay: (overlay: OverlayIdentifier) => void;
  setTime: (time: number) => void;
  setSelectedPoi: (poi: PoiIdentifier) => void;
  setCameraMode: (mode: CameraMode) => void;
  toggleAudio: () => void;
  setAudioEnabled: (value: boolean) => void;
}

export const usePlanetStore = create<PlanetStoreState>()(
  persist(
    (set) => ({
      currentPlanet: null,
      selectedOverlayId: null,
      time: Date.now(),
      selectedPoiId: null,
      cameraMode: "cinematic",
      audioEnabled: true,
      setCurrentPlanet: (planet) => set({ currentPlanet: planet }),
      setOverlay: (overlay) => set({ selectedOverlayId: overlay }),
      setTime: (time) => set({ time }),
      setSelectedPoi: (poi) => set({ selectedPoiId: poi }),
      setCameraMode: (mode) => set({ cameraMode: mode }),
      toggleAudio: () => set((state) => ({ audioEnabled: !state.audioEnabled })),
      setAudioEnabled: (value) => set({ audioEnabled: value }),
    }),
    {
      name: "cosmoscope-ui-preferences",
      partialize: (state) => ({
        cameraMode: state.cameraMode,
        audioEnabled: state.audioEnabled,
      }),
    },
  ),
);

export const PLANET_IDS: PlanetIdentifier[] = ["earth", "moon", "mars"];

export type PlanetRouteId = Exclude<PlanetIdentifier, null>;
