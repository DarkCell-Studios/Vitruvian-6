import { describe, expect, it, beforeEach } from "vitest";
import { usePlanetStore } from "@/state/usePlanetStore";

describe("usePlanetStore", () => {
  beforeEach(() => {
    usePlanetStore.setState({
      currentPlanet: null,
      selectedOverlayId: null,
      time: 0,
      selectedPoiId: null,
      cameraMode: "cinematic",
      audioEnabled: true,
    });
  });

  it("initialises with sensible defaults", () => {
    const state = usePlanetStore.getState();
    expect(state.currentPlanet).toBeNull();
    expect(state.audioEnabled).toBe(true);
    expect(state.cameraMode).toBe("cinematic");
  });

  it("toggles audio", () => {
    const { toggleAudio } = usePlanetStore.getState();
    toggleAudio();
    expect(usePlanetStore.getState().audioEnabled).toBe(false);
  });

  it("updates planet and overlay", () => {
    const { setCurrentPlanet, setOverlay } = usePlanetStore.getState();
    setCurrentPlanet("mars");
    setOverlay("thermal-overlay");
    expect(usePlanetStore.getState().currentPlanet).toBe("mars");
    expect(usePlanetStore.getState().selectedOverlayId).toBe("thermal-overlay");
  });
});
