import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { SolarSystemScene } from "@/components/SolarSystemScene";
import { NeonPopup } from "@/components/NeonPopup";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { dataAdapter } from "@/adapters/NasaAdapter";
import type { PlanetDetail, PlanetSummary } from "@/adapters/DataAdapter";
import { usePlanetStore, type CameraMode } from "@/state/usePlanetStore";
import { createWarpTimeline } from "@/lib/cameraTransitions";
import { ResizablePanels } from "@/components/layout/ResizablePanels";

const INTERACTABLE_PLANETS = new Set(["earth", "moon", "mars"]);

export default function SolarSystem() {
  const navigate = useNavigate();
  const cameraMode = usePlanetStore((state) => state.cameraMode);
  const setCameraMode = usePlanetStore((state) => state.setCameraMode);
  const currentPlanet = usePlanetStore((state) => state.currentPlanet);
  const setCurrentPlanet = usePlanetStore((state) => state.setCurrentPlanet);
  const setSelectedOverlay = usePlanetStore((state) => state.setOverlay);
  const setSelectedPoi = usePlanetStore((state) => state.setSelectedPoi);
  const [isWarping, setIsWarping] = useState(false);

  const { data: summaries = [] } = useQuery<PlanetSummary[]>({
    queryKey: ["planet-summaries"],
    queryFn: () => dataAdapter.getPlanetSummaries(),
    staleTime: 1000 * 60 * 30,
  });

  const selectedSummary = useMemo(
    () => summaries.find((summary) => summary.id === currentPlanet) ?? summaries.find((s) => s.id === "earth"),
    [summaries, currentPlanet],
  );

  const { data: detail, error: detailError } = useQuery<PlanetDetail>({
    queryKey: ["planet-detail", selectedSummary?.id],
    queryFn: () => dataAdapter.getPlanetDetail(selectedSummary?.id ?? "earth"),
    enabled: Boolean(selectedSummary?.id),
    staleTime: 1000 * 60 * 30,
  });

  const { data: missionRefs = [] } = useQuery({
    queryKey: ["missions", selectedSummary?.missions ?? []],
    queryFn: () => dataAdapter.getMissionRefs(selectedSummary?.missions ?? []),
    enabled: Boolean(selectedSummary?.missions?.length),
    staleTime: 1000 * 60 * 60,
  });

  useEffect(() => {
    document.title = "Cosmoscope · Solar System Hub";
  }, []);

  useEffect(() => {
    if (detailError) {
      toast.error(`Failed to load planet detail: ${detailError.message}`);
    }
  }, [detailError]);

  const handlePlanetFocus = useCallback(
    (planetId: string) => {
      if (!INTERACTABLE_PLANETS.has(planetId)) return;
      setCurrentPlanet(planetId as typeof currentPlanet);
      setSelectedPoi(null);
    },
    [setCurrentPlanet, setSelectedPoi],
  );

  const handleTravel = useCallback(
    async (planetId: string | null) => {
      if (!planetId) return;
      setIsWarping(true);
      const warp = createWarpTimeline();
      await warp.start();
      setSelectedOverlay(null);
      setIsWarping(false);
      navigate(`/planet/${planetId}`);
    },
    [navigate, setSelectedOverlay],
  );

  const handleCameraModeChange = (value: string) => {
    setCameraMode(value as CameraMode);
  };

  const infoHighlight = detail?.highlights ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-space-deep text-white">
      <header className="flex items-center justify-between px-8 py-6">
        <div>
          <p className="text-xs uppercase tracking-[0.6em] text-neon-pink">Solar System Hub</p>
          <h1 className="mt-2 text-3xl font-semibold uppercase tracking-[0.45em]">Select your destination</h1>
        </div>
        <ToggleGroup type="single" value={cameraMode} onValueChange={handleCameraModeChange}>
          <ToggleGroupItem value="cinematic">Cinematic</ToggleGroupItem>
          <ToggleGroupItem value="orthographic">Orthographic</ToggleGroupItem>
          <ToggleGroupItem value="top-down">Top</ToggleGroupItem>
        </ToggleGroup>
      </header>
      <main className="flex-1 px-8 pb-12">
        <ResizablePanels
          className="h-full"
          initialRatio={0.65}
          minPrimaryWidth={360}
          minSecondaryWidth={320}
          maxSecondaryWidth={640}
          storageKey="cosmoscope:solar-system-panels"
          handleLabel="Resize mission console"
          primary={
            <section className="relative flex h-full min-h-[60vh] overflow-hidden rounded-3xl border border-white/10 shadow-[0_0_40px_rgba(0,246,255,0.2)]">
              <SolarSystemScene
                cameraMode={cameraMode}
                selectedPlanetId={currentPlanet ?? undefined}
                onPlanetClick={handlePlanetFocus}
                onPlanetDoubleClick={handleTravel}
              />
              {isWarping ? (
                <div className="pointer-events-none absolute inset-0 animate-pulse bg-gradient-to-br from-neon-blue/20 via-neon-pink/15 to-transparent" />
              ) : null}
            </section>
          }
          secondary={
            <aside className="flex h-full min-h-[320px] flex-1 flex-col gap-6 overflow-hidden">
              <div className="rounded-3xl border border-white/10 bg-space-mid/70 p-6 backdrop-blur-2xl lg:max-h-[45vh] lg:overflow-y-auto">
                <h2 className="text-sm uppercase tracking-[0.4em] text-neon-blue">Mission Log</h2>
                <ul className="mt-4 space-y-3 text-sm text-white/70">
                  {summaries.map((summary) => (
                    <li key={summary.id} className="flex items-center justify-between gap-3">
                      <span className="truncate">{summary.name}</span>
                      <Button
                        variant={summary.id === currentPlanet ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePlanetFocus(summary.id)}
                      >
                        {summary.id === currentPlanet ? "Selected" : "Focus"}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
              {selectedSummary && detail ? (
                <NeonPopup
                  className="max-w-none overflow-hidden lg:flex-1"
                  title={selectedSummary.name}
                  subtitle={`${detail.age} · Gravity ${detail.gravity}`}
                  summary={detail.description}
                  missions={missionRefs}
                  onTravel={() => handleTravel(selectedSummary.id)}
                  onClose={() => setCurrentPlanet(null)}
                >
                  {infoHighlight.length > 0 ? (
                    <ul className="mt-4 list-disc space-y-1 pl-6 text-xs text-white/70">
                      {infoHighlight.map((fact) => (
                        <li key={fact}>{fact}</li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-3 text-xs uppercase tracking-[0.3em] text-neon-blue">
                    <span>Orbit {detail.orbitalPeriodDays} days</span>
                    <span>Rotation {detail.rotationHours}h</span>
                  </div>
                </NeonPopup>
              ) : null}
            </aside>
          }
        />
      </main>
    </div>
  );
}
