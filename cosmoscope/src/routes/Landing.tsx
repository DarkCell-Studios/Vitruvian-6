import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SolarSystemScene } from "@/components/SolarSystemScene";
import { AudioController } from "@/components/AudioController";
import { usePlanetStore } from "@/state/usePlanetStore";

const HERO_PLANET = "earth";

export default function Landing() {
  const navigate = useNavigate();
  const setCurrentPlanet = usePlanetStore((state) => state.setCurrentPlanet);

  useEffect(() => {
    document.title = "Cosmoscope · A Neon Atlas of the Solar System";
    setCurrentPlanet(HERO_PLANET);
  }, [setCurrentPlanet]);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-b from-space-deep via-space-mid to-space-deep">
      <div className="absolute inset-0 -z-10 opacity-70">
        <SolarSystemScene selectedPlanetId={HERO_PLANET} cameraMode="cinematic" interactive={false} />
      </div>
      <header className="flex items-center justify-between px-8 py-6">
        <div>
          <h1 className="text-xs uppercase tracking-[0.7em] text-neon-pink">Cosmoscope</h1>
          <p className="mt-2 text-3xl font-semibold uppercase tracking-[0.5em] text-white">
            Immersive solar voyages
          </p>
        </div>
        <AudioController />
      </header>
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center text-center">
        <div className="mx-auto max-w-3xl space-y-6 rounded-3xl border border-white/10 bg-space-deep/60 p-10 backdrop-blur-3xl">
          <h2 className="text-4xl font-semibold uppercase tracking-[0.4em] text-white">
            Plot your next odyssey
          </h2>
          <p className="text-base font-light leading-relaxed text-white/80">
            Navigate orbital choreographies, decode planetary overlays, and listen for the whispers of
            distant missions. Cosmoscope renders the solar system in neon relief—built for explorers,
            storytellers, and curious minds.
          </p>
          <Button size="lg" onClick={() => navigate("/system")}>Start Exploring</Button>
        </div>
        <p className="mt-10 text-xs uppercase tracking-[0.5em] text-white/50">
          Tip: Press “M” to toggle ambient sound
        </p>
      </main>
      <footer className="px-8 pb-6 text-xs uppercase tracking-[0.35em] text-white/30">
        Built for the Cosmoscope mission design doc
      </footer>
    </div>
  );
}
