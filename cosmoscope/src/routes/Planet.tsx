import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { PlanetMap } from "@/components/PlanetMap";
import { NeonPopup } from "@/components/NeonPopup";
import { Button } from "@/components/ui/button";
import { dataAdapter } from "@/adapters/NasaAdapter";
import type { PlanetDetail } from "@/adapters/DataAdapter";
import { usePlanetStore } from "@/state/usePlanetStore";

export default function Planet() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const planetId = (id ?? "mars").toLowerCase();
  const setCurrentPlanet = usePlanetStore((state) => state.setCurrentPlanet);
  const setSelectedOverlay = usePlanetStore((state) => state.setOverlay);
  const setTime = usePlanetStore((state) => state.setTime);
  const setSelectedPoi = usePlanetStore((state) => state.setSelectedPoi);

  const { data: detail, error } = useQuery<PlanetDetail>({
    queryKey: ["planet", planetId],
    queryFn: () => dataAdapter.getPlanetDetail(planetId),
    staleTime: 1000 * 60 * 30,
  });

  useEffect(() => {
    document.title = `Cosmoscope · ${planetId.toUpperCase()}`;
    setCurrentPlanet(planetId as never);
    setSelectedOverlay(null);
    setTime(Date.now());
    setSelectedPoi(null);
  }, [planetId, setCurrentPlanet, setSelectedOverlay, setSelectedPoi, setTime]);

  useEffect(() => {
    if (error) {
      toast.error(`Failed to load planet view: ${error.message}`);
    }
  }, [error]);

  if (!detail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-space-deep text-white">
        <p className="text-sm uppercase tracking-[0.3em] text-white/60">Loading planet telemetry…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-space-deep text-white">
      <header className="flex items-center justify-between px-8 py-6">
        <div>
          <p className="text-xs uppercase tracking-[0.5em] text-neon-pink">Planet View</p>
          <h1 className="mt-2 text-3xl font-semibold uppercase tracking-[0.45em]">{detail.name ?? planetId}</h1>
        </div>
        <Button variant="outline" onClick={() => navigate("/system")}>Return to system</Button>
      </header>
      <main className="grid flex-1 grid-cols-1 gap-8 px-8 pb-12 lg:grid-cols-[2fr_1fr]">
        <section>
          <PlanetMap planetId={planetId} />
        </section>
        <aside className="flex flex-col gap-6">
          <NeonPopup
            title={detail.name}
            subtitle={`${detail.age} · Gravity ${detail.gravity}`}
            summary={detail.description}
            missions={[]}
            actionLabel="Mission Control"
            onTravel={() => navigate("/system")}
          >
            <ul className="mt-4 grid grid-cols-1 gap-2 text-sm text-white/70">
              <li>Orbital period: {detail.orbitalPeriodDays} Earth days</li>
              <li>Rotation: {detail.rotationHours} hours</li>
              <li>Key missions: {detail.missions.join(", ")}</li>
            </ul>
          </NeonPopup>
        </aside>
      </main>
    </div>
  );
}
