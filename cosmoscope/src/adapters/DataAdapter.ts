export interface MissionRef {
  id: string;
  name: string;
  agency: string;
  year: number;
  status: "planned" | "active" | "completed";
  summary: string;
}

export interface PlanetSummary {
  id: string;
  name: string;
  age: string;
  headline: string;
  missions: string[];
  accentColor: string;
}

export interface PlanetDetail extends PlanetSummary {
  description: string;
  highlights: string[];
  orbitalPeriodDays: number;
  rotationHours: number;
  gravity: string;
}

export type OverlayKind = "raster" | "vector" | "heat";

export interface OverlayDescriptor {
  id: string;
  label: string;
  description: string;
  kind: OverlayKind;
  color: string;
  timeSteps: string[];
  defaultTime: string;
}

export interface PoiFeature {
  id: string;
  name: string;
  description: string;
  coordinates: [number, number];
  images: string[];
  minZoom: number;
  overlayIds: string[];
  missions: string[];
}

export interface DataAdapter {
  getPlanetSummaries(): Promise<PlanetSummary[]>;
  getPlanetDetail(planetId: string): Promise<PlanetDetail>;
  getOverlayDescriptors(planetId: string): Promise<OverlayDescriptor[]>;
  getOverlayTileUrl(planetId: string, overlayId: string, timeIso: string): string;
  getPoiFeatures(planetId: string): Promise<PoiFeature[]>;
  getMissionRefs(ids: string[]): Promise<MissionRef[]>;
}
