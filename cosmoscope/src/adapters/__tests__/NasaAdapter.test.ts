import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NasaAdapter } from "@/adapters/NasaAdapter";
import type { PlanetDetail, PlanetSummary } from "@/adapters/DataAdapter";

const summaryFixture: PlanetSummary[] = [
  {
    id: "mars",
    name: "Mars",
    age: "4.6 Ga",
    headline: "Frontier",
    missions: ["perseverance"],
    accentColor: "#d96c3d",
  },
];

const detailFixture: Record<string, PlanetDetail> = {
  mars: {
    id: "mars",
    name: "Mars",
    age: "4.6 Ga",
    headline: "Frontier",
    missions: ["perseverance"],
    accentColor: "#d96c3d",
    description: "Mock Mars",
    highlights: ["Test"],
    orbitalPeriodDays: 687,
    rotationHours: 24.6,
    gravity: "0.38 g",
  },
};

const overlaysFixture = {
  mars: [
    {
      id: "base-overlay",
      label: "Base",
      description: "",
      kind: "raster" as const,
      color: "#ffffff",
      timeSteps: ["2024-01-01T00:00:00Z"],
      defaultTime: "2024-01-01T00:00:00Z",
    },
  ],
};

const poisFixture = {
  mars: [
    {
      id: "poi-1",
      name: "Test POI",
      description: "",
      coordinates: [0, 0] as [number, number],
      images: [],
      minZoom: 2,
      overlayIds: ["base-overlay"],
      missions: ["perseverance"],
    },
  ],
};

const missionsFixture = {
  perseverance: {
    id: "perseverance",
    name: "Perseverance",
    agency: "NASA",
    year: 2021,
    status: "active" as const,
    summary: "Mars rover",
  },
};

describe("NasaAdapter", () => {
  const adapter = new NasaAdapter();

  beforeEach(() => {
    vi.spyOn(global, "fetch").mockImplementation((url: RequestInfo | URL) => {
      const href = typeof url === "string" ? url : url.toString();
      const dataMap: Record<string, unknown> = {
        "/mock/planet-summaries.json": summaryFixture,
        "/mock/planet-details.json": detailFixture,
        "/mock/overlays.json": overlaysFixture,
        "/mock/pois.json": poisFixture,
        "/mock/missions.json": missionsFixture,
      };

      const body = dataMap[href];
      if (!body) {
        return Promise.resolve({ ok: false, status: 404 } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => structuredClone(body),
      } as Response);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns summaries and details", async () => {
    const summaries = await adapter.getPlanetSummaries();
    expect(summaries).toHaveLength(1);

    const detail = await adapter.getPlanetDetail("mars");
    expect(detail.gravity).toBe("0.38 g");
  });

  it("provides overlay descriptors", async () => {
    const overlays = await adapter.getOverlayDescriptors("mars");
    expect(overlays[0].id).toBe("base-overlay");
  });

  it("formats overlay tile url", async () => {
    await adapter.getOverlayDescriptors("mars");
    const url = adapter.getOverlayTileUrl("mars", "base-overlay", "2024-01-01T00:00:00Z");
    expect(url.startsWith("data:image/svg+xml,")).toBe(true);
    const decoded = decodeURIComponent(url.replace("data:image/svg+xml,", ""));
    expect(decoded).toContain("Base");
  });

  it("returns POIs and missions", async () => {
    const pois = await adapter.getPoiFeatures("mars");
    expect(pois[0].id).toBe("poi-1");

    const missions = await adapter.getMissionRefs(["perseverance"]);
    expect(missions[0].name).toBe("Perseverance");
  });
});
