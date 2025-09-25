import { CatmullRomCurve3, Vector3 } from "three";

interface CameraLike {
  position: Vector3;
  lookAt: (target: Vector3) => void;
}

export interface CameraFlightOptions {
  duration?: number;
  lookAt?: Vector3;
}

export function buildCameraSpline(start: Vector3, destination: Vector3): CatmullRomCurve3 {
  const midPoint = start.clone().lerp(destination, 0.5).add(new Vector3(0, 2.5, 0));
  const controlPoints = [start.clone(), midPoint, destination.clone()];
  return new CatmullRomCurve3(controlPoints, false, "catmullrom", 0.5);
}

export function sampleSpline(curve: CatmullRomCurve3, steps = 32): Vector3[] {
  const points: Vector3[] = [];
  for (let i = 0; i <= steps; i += 1) {
    points.push(curve.getPoint(i / steps));
  }
  return points;
}

export function executeCameraFlight(
  camera: CameraLike,
  spline: CatmullRomCurve3,
  { duration = 2200, lookAt }: CameraFlightOptions = {},
): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeInOutCubic(t);
      const point = spline.getPoint(eased);
      camera.position.copy(point);
      if (lookAt) {
        camera.lookAt(lookAt);
      }
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        resolve();
      }
    };

    requestAnimationFrame(tick);
  });
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function createWarpTimeline(totalDuration = 1400): {
  start: () => Promise<void>;
} {
  return {
    start: () =>
      new Promise<void>((resolve) => {
        setTimeout(() => resolve(), totalDuration);
      }),
  };
}
