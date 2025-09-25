import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import maskFragmentShader from "@/shaders/CircularMask.glsl?raw";
import { dataAdapter } from "@/adapters/NasaAdapter";
import type { OverlayDescriptor, PoiFeature } from "@/adapters/DataAdapter";
import { PoiMarkers } from "@/components/PoiMarkers";
import { TimeSlider } from "@/components/TimeSlider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { NeonPopup } from "@/components/NeonPopup";
import { usePlanetStore } from "@/state/usePlanetStore";
import { cn } from "@/utils/cn";

import "maplibre-gl/dist/maplibre-gl.css";

const vertexShader = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const OVERLAY_SOURCE_ID = "planet-overlay-source";
const OVERLAY_LAYER_ID = "planet-overlay-layer";

interface PlanetMapProps {
  planetId: string;
}

const hexToRgb = (hex: string): [number, number, number] => {
  const normalised = hex.replace("#", "");
  const bigint = Number.parseInt(normalised, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r / 255, g / 255, b / 255];
};

const useOverlays = (planetId: string) =>
  useQuery<OverlayDescriptor[], Error>({
    queryKey: ["overlays", planetId],
    queryFn: () => dataAdapter.getOverlayDescriptors(planetId),
    staleTime: 1000 * 60 * 15,
  });

const usePois = (planetId: string) =>
  useQuery<PoiFeature[], Error>({
    queryKey: ["pois", planetId],
    queryFn: () => dataAdapter.getPoiFeatures(planetId),
    staleTime: 1000 * 60 * 5,
  });

const useMissions = (missionIds: string[]) =>
  useQuery({
    queryKey: ["missions", missionIds],
    queryFn: () => dataAdapter.getMissionRefs(missionIds),
    enabled: missionIds.length > 0,
    staleTime: 1000 * 60 * 60,
  });

interface MaskProgram {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  uniforms: {
    resolution: WebGLUniformLocation | null;
    cursor: WebGLUniformLocation | null;
    radius: WebGLUniformLocation | null;
    feather: WebGLUniformLocation | null;
    color: WebGLUniformLocation | null;
    intensity: WebGLUniformLocation | null;
  };
  raf?: number;
}

export const PlanetMap = ({ planetId }: PlanetMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskProgramRef = useRef<MaskProgram | null>(null);
  const cursorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const colorRef = useRef<[number, number, number]>([0, 1, 1]);
  const intensityRef = useRef(1);
  const isMapReadyRef = useRef(false);
  const [isWarping, setIsWarping] = useState(false);
  const selectedOverlayId = usePlanetStore((state) => state.selectedOverlayId);
  const setOverlay = usePlanetStore((state) => state.setOverlay);
  const sliderTime = usePlanetStore((state) => state.time);
  const setTime = usePlanetStore((state) => state.setTime);
  const selectedPoiId = usePlanetStore((state) => state.selectedPoiId);
  const setSelectedPoi = usePlanetStore((state) => state.setSelectedPoi);
  const overlayToggleRef = useRef<HTMLDivElement | null>(null);
  const timeSliderGroupRef = useRef<HTMLDivElement | null>(null);

  const {
    data: overlays,
    error: overlayError,
    isLoading: overlaysLoading,
  } = useOverlays(planetId);

  const { data: pois = [], error: poiError } = usePois(planetId);

  const activeOverlay = useMemo(
    () => overlays?.find((overlay) => overlay.id === selectedOverlayId) ?? overlays?.[0],
    [overlays, selectedOverlayId],
  );

  const timeSteps = useMemo(() => activeOverlay?.timeSteps.map((iso) => Date.parse(iso)) ?? [], [activeOverlay]);
  const minTime = timeSteps[0] ?? Date.now();
  const maxTime = timeSteps[timeSteps.length - 1] ?? Date.now();

  const activeTime = useMemo(() => {
    if (timeSteps.length === 0) return sliderTime;
    const closest = timeSteps.reduce((prev, curr) =>
      Math.abs(curr - sliderTime) < Math.abs(prev - sliderTime) ? curr : prev,
    );
    return closest;
  }, [sliderTime, timeSteps]);

  const activePoi = useMemo(() => pois.find((poi) => poi.id === selectedPoiId), [pois, selectedPoiId]);
  const { data: missionRefs = [] } = useMissions(activePoi?.missions ?? []);

  useEffect(() => {
    if (!activeOverlay) return;
    const defaultTime = Date.parse(activeOverlay.defaultTime);
    if (Number.isNaN(defaultTime)) return;
    if (!timeSteps.includes(sliderTime)) {
      setTime(defaultTime);
    }
  }, [activeOverlay, setTime, sliderTime, timeSteps]);

  useEffect(() => {
    if (overlayError) {
      toast.error(`Failed to load overlays: ${overlayError.message}`);
    }
  }, [overlayError]);

  useEffect(() => {
    if (poiError) {
      toast.error(`Failed to load points of interest: ${poiError.message}`);
    }
  }, [poiError]);

  useEffect(() => {
    if (!overlays || overlays.length === 0) return;
    if (!selectedOverlayId) {
      setOverlay(overlays[0].id);
    }
  }, [overlays, selectedOverlayId, setOverlay]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "/mapstyle.json",
      center: [0, 0],
      zoom: 1.5,
      pitch: 20,
      hash: false,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }));
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: "metric" }));

    mapRef.current = map;

    const handleLoad = () => {
      isMapReadyRef.current = true;
    };
    map.on("load", handleLoad);

    const updateCanvasSize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = clientWidth * ratio;
      canvas.height = clientHeight * ratio;
      canvas.style.width = `${clientWidth}px`;
      canvas.style.height = `${clientHeight}px`;
      const program = maskProgramRef.current;
      if (program?.uniforms.resolution) {
        program.gl.useProgram(program.program);
        program.gl.uniform2f(program.uniforms.resolution, canvas.width, canvas.height);
      }
    };

    const resizeObserver = new ResizeObserver(() => updateCanvasSize());
    resizeObserver.observe(containerRef.current);
    updateCanvasSize();

    map.on("mousemove", (event) => {
      const canvas = canvasRef.current;
      const mapCanvas = map.getCanvas();
      if (!canvas) return;
      const { width, height } = mapCanvas;
      cursorRef.current = {
        x: (event.point.x / width) * canvas.width,
        y: canvas.height - (event.point.y / height) * canvas.height,
      };
    });

    return () => {
      resizeObserver.disconnect();
      map.off("load", handleLoad);
      map.remove();
      mapRef.current = null;
      isMapReadyRef.current = false;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || maskProgramRef.current) return;
    const gl = canvas.getContext("webgl");
    if (!gl) {
      console.warn("WebGL not supported, overlay mask disabled");
      return;
    }

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Unable to create shader");
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader) ?? "Shader compilation failed");
      }
      return shader;
    };

    const vertex = compileShader(gl.VERTEX_SHADER, vertexShader);
    const fragment = compileShader(gl.FRAGMENT_SHADER, maskFragmentShader);

    const program = gl.createProgram();
    if (!program) throw new Error("Failed to create WebGL program");
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) ?? "Failed to link WebGL program");
    }

    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([
      -1, -1,
      1, -1,
      -1, 1,
      -1, 1,
      1, -1,
      1, 1,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
      resolution: gl.getUniformLocation(program, "u_resolution"),
      cursor: gl.getUniformLocation(program, "u_cursor"),
      radius: gl.getUniformLocation(program, "u_radius"),
      feather: gl.getUniformLocation(program, "u_feather"),
      color: gl.getUniformLocation(program, "u_color"),
      intensity: gl.getUniformLocation(program, "u_intensity"),
    } as const;

    maskProgramRef.current = { gl, program, uniforms };

    const render = () => {
      const maskProgram = maskProgramRef.current;
      const targetCanvas = canvasRef.current;
      if (!maskProgram || !targetCanvas) return;
      const { gl: context, uniforms: currentUniforms } = maskProgram;
      const canvasWidth = targetCanvas.width;
      const canvasHeight = targetCanvas.height;
      const radius = Math.min(canvasWidth, canvasHeight) * 0.25;
      context.viewport(0, 0, canvasWidth, canvasHeight);
      context.clearColor(0, 0, 0, 0);
      context.clear(context.COLOR_BUFFER_BIT);
      context.uniform2f(currentUniforms.resolution, canvasWidth, canvasHeight);
      context.uniform2f(currentUniforms.cursor, cursorRef.current.x, cursorRef.current.y);
      context.uniform1f(currentUniforms.radius, radius);
      context.uniform1f(currentUniforms.feather, radius * 0.55);
      context.uniform4f(currentUniforms.color, colorRef.current[0], colorRef.current[1], colorRef.current[2], 0.85);
      context.uniform1f(currentUniforms.intensity, intensityRef.current);
      context.drawArrays(context.TRIANGLES, 0, 6);
      maskProgram.raf = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (maskProgramRef.current?.raf) {
        cancelAnimationFrame(maskProgramRef.current.raf);
      }
      maskProgramRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!activeOverlay) return;
    colorRef.current = hexToRgb(activeOverlay.color ?? "#00f6ff");
  }, [activeOverlay]);

  useEffect(() => {
    intensityRef.current = isWarping ? 0.3 : 1;
  }, [isWarping]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!overlays || overlays.length === 0) return;
      if (event.key.toLowerCase() === "o") {
        event.preventDefault();
        const currentIndex = overlays.findIndex((overlay) => overlay.id === activeOverlay?.id);
        const nextOverlay = overlays[(currentIndex + 1) % overlays.length];
        setOverlay(nextOverlay.id);
        overlayToggleRef.current?.focus();
      }
      if (event.key.toLowerCase() === "t") {
        event.preventDefault();
        timeSliderGroupRef.current?.focus();
      }
      if (event.key === "Escape") {
        setSelectedPoi(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeOverlay?.id, overlays, setOverlay, setSelectedPoi]);

  const handleOverlayChange = useCallback(
    (value: string) => {
      if (value) setOverlay(value);
    },
    [setOverlay],
  );

  const overlayTileUrl = useMemo(() => {
    if (!activeOverlay) return null;
    return dataAdapter.getOverlayTileUrl(planetId, activeOverlay.id, new Date(activeTime).toISOString());
  }, [activeOverlay, activeTime, planetId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const installOrUpdateOverlay = () => {
      if (!overlayTileUrl) {
        if (map.getLayer(OVERLAY_LAYER_ID)) {
          map.removeLayer(OVERLAY_LAYER_ID);
        }
        if (map.getSource(OVERLAY_SOURCE_ID)) {
          map.removeSource(OVERLAY_SOURCE_ID);
        }
        return;
      }

      if (map.getLayer(OVERLAY_LAYER_ID)) {
        map.removeLayer(OVERLAY_LAYER_ID);
      }
      if (map.getSource(OVERLAY_SOURCE_ID)) {
        map.removeSource(OVERLAY_SOURCE_ID);
      }

      map.addSource(OVERLAY_SOURCE_ID, {
        type: "raster",
        tiles: [overlayTileUrl],
        tileSize: 512,
      });
      map.addLayer(
        {
          id: OVERLAY_LAYER_ID,
          type: "raster",
          source: OVERLAY_SOURCE_ID,
          paint: {
            "raster-opacity": 0.85,
            "raster-fade-duration": 0,
          },
        },
        undefined,
      );
    };

    if (isMapReadyRef.current || map.isStyleLoaded()) {
      installOrUpdateOverlay();
    } else {
      const handleLoad = () => {
        installOrUpdateOverlay();
        map.off("load", handleLoad);
        isMapReadyRef.current = true;
      };
      map.on("load", handleLoad);
      return () => {
        map.off("load", handleLoad);
      };
    }

    return () => {
      if (!overlayTileUrl) return;
      if (!map.getSource(OVERLAY_SOURCE_ID)) return;
      if (map.getLayer(OVERLAY_LAYER_ID)) {
        map.removeLayer(OVERLAY_LAYER_ID);
      }
      map.removeSource(OVERLAY_SOURCE_ID);
    };
  }, [overlayTileUrl]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer(OVERLAY_LAYER_ID)) return;
    map.setPaintProperty(OVERLAY_LAYER_ID, "raster-opacity", isWarping ? 0.35 : 0.85);
  }, [isWarping]);

  const handleTimeChange = useCallback(
    (next: number) => {
      setTime(next);
    },
    [setTime],
  );

  const handlePoiSelect = useCallback(
    (poiId: string) => {
      setSelectedPoi(poiId);
    },
    [setSelectedPoi],
  );

  useEffect(() => {
    if (!activePoi || !mapRef.current) return;
    const map = mapRef.current;
    map.flyTo({ center: activePoi.coordinates as [number, number], zoom: Math.max(map.getZoom(), 3.5), speed: 0.7 });
  }, [activePoi]);

  return (
    <div className="relative flex h-full min-h-[60vh] flex-col gap-4">
      <div className="relative h-[65vh] w-full overflow-hidden rounded-3xl border border-white/10 shadow-[0_0_40px_rgba(0,246,255,0.2)]">
        <div ref={containerRef} className="absolute inset-0" aria-label="Planet surface map" role="presentation" />
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" />
        {mapRef.current ? <PoiMarkers map={mapRef.current} pois={pois} onSelect={handlePoiSelect} /> : null}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between p-4">
          <span className="pointer-events-auto rounded-full border border-white/10 bg-space-mid/70 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/70">
            Overlay: {activeOverlay?.label ?? "Loading"}
          </span>
          <span className="pointer-events-auto rounded-full border border-white/10 bg-space-mid/70 px-4 py-1 text-xs uppercase tracking-[0.3em] text-neon-blue">
            Tiles: {overlayTileUrl ?? "—"}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div
          ref={overlayToggleRef}
          tabIndex={-1}
          className="outline-none"
          aria-label="Overlay toggle group"
        >
          <ToggleGroup
            type="single"
            value={activeOverlay?.id}
            onValueChange={handleOverlayChange}
            className="pointer-events-auto"
          >
            {overlaysLoading ? (
              <ToggleGroupItem value="loading" disabled>
                Loading overlays
              </ToggleGroupItem>
            ) : (
              overlays?.map((overlay) => (
                <ToggleGroupItem key={overlay.id} value={overlay.id} aria-label={`Overlay ${overlay.label}`}>
                  {overlay.label}
                </ToggleGroupItem>
              ))
            )}
          </ToggleGroup>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setIsWarping((state) => !state)}>
          {isWarping ? "Disable warp" : "Enable warp"}
        </Button>
      </div>
      {activeOverlay ? (
        <p className="text-xs font-light uppercase tracking-[0.35em] text-white/50">
          {activeOverlay.kind.toUpperCase()} · {activeOverlay.description}
        </p>
      ) : null}
      <div
        ref={timeSliderGroupRef}
        tabIndex={-1}
        role="group"
        aria-label="Overlay time slider"
        className={cn("outline-none")}
      >
        <TimeSlider
          value={activeTime}
          min={minTime}
          max={maxTime}
          onChange={handleTimeChange}
          label="Time"
          disabled={timeSteps.length <= 1}
        />
      </div>
      {activePoi ? (
        <NeonPopup
          title={activePoi.name}
          summary={activePoi.description}
          missions={missionRefs}
          actionLabel="Close"
          onTravel={() => setSelectedPoi(null)}
        >
          {activePoi.images.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {activePoi.images.map((src) => (
                <div key={src} className="overflow-hidden rounded-xl border border-white/10">
                  <img src={src} alt="POI gallery" className="h-24 w-full object-cover" />
                </div>
              ))}
            </div>
          ) : null}
        </NeonPopup>
      ) : null}
    </div>
  );
};
