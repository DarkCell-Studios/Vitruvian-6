import type {
  DataAdapter,
  MissionRef,
  OverlayDescriptor,
  PlanetDetail,
  PlanetSummary,
  PoiFeature,
} from "./DataAdapter";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status}`);
  }

  return (await response.json()) as T;
}

const SUMMARY_URL = "/mock/planet-summaries.json";
const DETAIL_URL = "/mock/planet-details.json";
const OVERLAY_URL = "/mock/overlays.json";
const POI_URL = "/mock/pois.json";
const MISSION_URL = "/mock/missions.json";

type OverlayIndex = Record<string, OverlayDescriptor[]>;
type PoiIndex = Record<string, PoiFeature[]>;
type DetailIndex = Record<string, PlanetDetail>;
type MissionIndex = Record<string, MissionRef>;

const DEFAULT_OVERLAY_COLOR = "#24b2ff";

function titleCase(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildOverlayTileSvg(
  planetName: string,
  overlayLabel: string,
  overlayColor: string,
  timeIso: string,
): string {
  const parsed = new Date(timeIso);
  const formattedTime = Number.isNaN(parsed.getTime())
    ? timeIso
    : parsed.toISOString().split("T")[0] ?? parsed.toISOString();

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <defs>
        <radialGradient id="glow" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stop-color="${overlayColor}" stop-opacity="0.85" />
          <stop offset="100%" stop-color="${overlayColor}" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="scan" x1="0%" x2="0%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="${overlayColor}" stop-opacity="0" />
          <stop offset="50%" stop-color="${overlayColor}" stop-opacity="0.3" />
          <stop offset="100%" stop-color="${overlayColor}" stop-opacity="0" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" fill="#050510" />
      <rect width="512" height="512" fill="url(#glow)" opacity="0.8" />
      <rect width="512" height="512" fill="url(#scan)" opacity="0.65" />
      <text x="50%" y="55%" fill="#ffffff" font-size="42" text-anchor="middle" font-family="'Space Mono', monospace">
        ${planetName}
      </text>
      <text x="50%" y="68%" fill="#ffffff" font-size="28" text-anchor="middle" font-family="'Space Mono', monospace" opacity="0.85">
        ${overlayLabel}
      </text>
      <text x="50%" y="82%" fill="#ffffff" font-size="22" text-anchor="middle" font-family="'Space Mono', monospace" opacity="0.7">
        ${formattedTime}
      </text>
    </svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`;
}

export class NasaAdapter implements DataAdapter {
  private summaryPromise?: Promise<PlanetSummary[]>;
  private detailPromise?: Promise<DetailIndex>;
  private overlayPromise?: Promise<OverlayIndex>;
  private poiPromise?: Promise<PoiIndex>;
  private missionPromise?: Promise<MissionIndex>;
  private overlayCache: OverlayIndex = {};

  async getPlanetSummaries(): Promise<PlanetSummary[]> {
    if (!this.summaryPromise) {
      this.summaryPromise = fetchJson<PlanetSummary[]>(SUMMARY_URL);
    }

    const summaries = await this.summaryPromise;
    return summaries.map((summary) => ({ ...summary }));
  }

  async getPlanetDetail(planetId: string): Promise<PlanetDetail> {
    if (!this.detailPromise) {
      this.detailPromise = fetchJson<DetailIndex>(DETAIL_URL);
    }

    const detailIndex = await this.detailPromise;
    const detail = detailIndex[planetId];

    if (!detail) {
      throw new Error(`Unknown planet detail requested for ${planetId}`);
    }

    return { ...detail, highlights: [...detail.highlights], missions: [...detail.missions] };
  }

  async getOverlayDescriptors(planetId: string): Promise<OverlayDescriptor[]> {
    if (!this.overlayPromise) {
      this.overlayPromise = fetchJson<OverlayIndex>(OVERLAY_URL);
    }

    const overlayIndex = await this.overlayPromise;

    if (!this.overlayCache[planetId]) {
      const overlays = overlayIndex[planetId] ?? [];
      this.overlayCache[planetId] = overlays.map((overlay) => ({
        ...overlay,
        timeSteps: [...overlay.timeSteps],
      }));
    }

    return this.overlayCache[planetId].map((overlay) => ({
      ...overlay,
      timeSteps: [...overlay.timeSteps],
    }));
  }

  getOverlayTileUrl(planetId: string, overlayId: string, timeIso: string): string {
    const overlays = this.overlayCache[planetId];
    const overlay = overlays?.find((candidate) => candidate.id === overlayId);

    const color = overlay?.color ?? DEFAULT_OVERLAY_COLOR;
    const overlayLabel = overlay?.label ?? titleCase(overlayId.replace(/-/g, " "));
    const planetLabel = titleCase(planetId.replace(/-/g, " "));

    return buildOverlayTileSvg(planetLabel, overlayLabel, color, timeIso);
  }

  async getPoiFeatures(planetId: string): Promise<PoiFeature[]> {
    if (!this.poiPromise) {
      this.poiPromise = fetchJson<PoiIndex>(POI_URL);
    }

    const poiIndex = await this.poiPromise;
    const pois = poiIndex[planetId] ?? [];
    return pois.map((poi) => ({
      ...poi,
      coordinates: [...poi.coordinates] as [number, number],
      images: [...poi.images],
      overlayIds: [...poi.overlayIds],
      missions: [...poi.missions],
    }));
  }

  async getMissionRefs(ids: string[]): Promise<MissionRef[]> {
    if (!this.missionPromise) {
      this.missionPromise = fetchJson<MissionIndex>(MISSION_URL);
    }

    const missionIndex = await this.missionPromise;
    return ids
      .map((id) => missionIndex[id])
      .filter(Boolean)
      .map((mission) => ({ ...mission }));
  }
}

export const dataAdapter = new NasaAdapter();
