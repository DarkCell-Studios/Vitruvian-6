import { useEffect, useRef, useState } from "react";
import ambientTrack from "@/assets/audio/ambient-space.mp3";
import { usePlanetStore } from "@/state/usePlanetStore";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Volume2, VolumeX } from "lucide-react";

export const AudioController = () => {
  const audioEnabled = usePlanetStore((state) => state.audioEnabled);
  const toggleAudio = usePlanetStore((state) => state.toggleAudio);
  const setAudioEnabled = usePlanetStore((state) => state.setAudioEnabled);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [volume, setVolume] = useState(0.4);

  useEffect(() => {
    if (audioRef.current) {
      return;
    }
    const element = new Audio(ambientTrack);
    element.loop = true;
    element.volume = volume;
    audioRef.current = element;

    if (audioEnabled) {
      void element.play().catch(() => setAudioEnabled(false));
    }

    return () => {
      element.pause();
      audioRef.current = null;
    };
  }, [audioEnabled, setAudioEnabled, volume]);

  useEffect(() => {
    const element = audioRef.current;
    if (!element) return;
    if (audioEnabled) {
      void element.play().catch(() => setAudioEnabled(false));
    } else {
      element.pause();
    }
  }, [audioEnabled, setAudioEnabled]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "m") {
        event.preventDefault();
        toggleAudio();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleAudio]);

  const handleVolumeChange = (value: number[]) => {
    const next = value[0] ?? volume;
    setVolume(next);
    if (audioRef.current) {
      audioRef.current.volume = next;
      if (next > 0 && !audioEnabled) {
        setAudioEnabled(true);
      }
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-full border border-white/10 bg-space-mid/60 px-3 py-1.5 backdrop-blur-xl">
      <Button
        variant="ghost"
        size="icon"
        aria-label={audioEnabled ? "Mute ambient soundtrack" : "Unmute ambient soundtrack"}
        onClick={() => toggleAudio()}
      >
        {audioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
      </Button>
      <div className="w-32">
        <Slider
          label="Ambient volume"
          value={[volume]}
          onValueChange={handleVolumeChange}
          max={1}
          step={0.05}
        />
      </div>
    </div>
  );
};
