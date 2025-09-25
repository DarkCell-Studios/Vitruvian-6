/* eslint-disable react/no-unknown-property */
import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { Color, Group, Mesh, Vector3 } from "three";
import type { CameraMode } from "@/state/usePlanetStore";

const PLANET_DATA = [
  { id: "sun", size: 1.8, color: "#ffbb55", distance: 0, speed: 0, interactive: false, opacity: 1 },
  { id: "mercury", size: 0.25, color: "#a7a39b", distance: 3, speed: 1.2, interactive: false, opacity: 0.35 },
  { id: "venus", size: 0.35, color: "#d8c388", distance: 4, speed: 1, interactive: false, opacity: 0.35 },
  { id: "earth", size: 0.4, color: "#4a90e2", distance: 5, speed: 0.9, interactive: true, opacity: 1 },
  { id: "moon", size: 0.18, color: "#f2f5f7", distance: 5.7, speed: 1.6, interactive: true, opacity: 1 },
  { id: "mars", size: 0.32, color: "#d96c3d", distance: 6.5, speed: 0.85, interactive: true, opacity: 1 },
  { id: "jupiter", size: 0.8, color: "#e0a37e", distance: 8.5, speed: 0.6, interactive: false, opacity: 0.25 },
  { id: "saturn", size: 0.7, color: "#f5deaa", distance: 10.5, speed: 0.5, interactive: false, opacity: 0.25 },
  { id: "uranus", size: 0.45, color: "#8dd0e0", distance: 12, speed: 0.42, interactive: false, opacity: 0.25 },
  { id: "neptune", size: 0.4, color: "#4b79ff", distance: 13.5, speed: 0.39, interactive: false, opacity: 0.25 },
] as const;

interface SolarSystemSceneProps {
  selectedPlanetId?: string | null;
  interactive?: boolean;
  cameraMode: CameraMode;
  onPlanetClick?: (planetId: string) => void;
  onPlanetDoubleClick?: (planetId: string) => void;
}

interface PlanetMeshProps {
  id: string;
  size: number;
  color: string;
  distance: number;
  speed: number;
  opacity: number;
  interactive: boolean;
  selected: boolean;
  onClick?: (planetId: string) => void;
  onDoubleClick?: (planetId: string) => void;
}

const PlanetMesh = ({
  id,
  size,
  color,
  distance,
  speed,
  opacity,
  interactive,
  selected,
  onClick,
  onDoubleClick,
}: PlanetMeshProps) => {
  const meshRef = useRef<Mesh>(null!);
  const pivotRef = useRef<Group>(null!);
  const baseColor = useMemo(() => new Color(color), [color]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed;
    if (pivotRef.current) {
      pivotRef.current.rotation.y = t;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003;
    }
  });

  return (
    <group ref={pivotRef}>
      {distance > 0 ? (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[distance - 0.02, distance + 0.02, 64]} />
          <meshBasicMaterial color="#2c2a4a" transparent opacity={0.2} />
        </mesh>
      ) : null}
      <mesh
        ref={meshRef}
        position={[distance, 0, 0]}
        scale={[size, size, size]}
        onClick={(event) => {
          if (!interactive) return;
          event.stopPropagation();
          onClick?.(id);
        }}
        onDoubleClick={(event) => {
          if (!interactive) return;
          event.stopPropagation();
          onDoubleClick?.(id);
        }}
      >
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial color={baseColor} transparent opacity={opacity} />
        {selected && (
          <mesh scale={[1.4, 1.4, 1.4]}>
            <icosahedronGeometry args={[1.1, 0]} />
            <meshBasicMaterial color="#00f6ff" wireframe transparent opacity={0.5} />
          </mesh>
        )}
      </mesh>
    </group>
  );
};

const CameraRig = ({ cameraMode }: { cameraMode: CameraMode }) => {
  const { camera } = useThree();
  useEffect(() => {
    if (cameraMode === "top-down") {
      camera.position.set(0, 18, 0.01);
      camera.lookAt(new Vector3(0, 0, 0));
    } else if (cameraMode === "orthographic") {
      camera.position.set(0, 6, 12);
      camera.lookAt(new Vector3(0, 0, 0));
    } else {
      camera.position.set(6, 4, 10);
      camera.lookAt(new Vector3(0, 0, 0));
    }
  }, [camera, cameraMode]);
  return null;
};

export const SolarSystemScene = ({
  selectedPlanetId,
  interactive = true,
  cameraMode,
  onPlanetClick,
  onPlanetDoubleClick,
}: SolarSystemSceneProps) => {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [6, 4, 10], fov: 55, near: 0.1, far: 1000 }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#030014"]} />
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 0, 0]} intensity={3} color="#ffddaa" />
      <Suspense fallback={null}>
        <Stars radius={60} depth={50} count={6000} factor={7} saturation={0} fade speed={2} />
      </Suspense>
      <CameraRig cameraMode={cameraMode} />
      <OrbitControls
        enablePan={interactive}
        enableZoom={interactive}
        enableRotate={interactive}
        makeDefault
        maxDistance={22}
        minDistance={4}
      />
      {PLANET_DATA.map((planet) => (
        <PlanetMesh
          key={planet.id}
          {...planet}
          selected={selectedPlanetId === planet.id}
          onClick={onPlanetClick}
          onDoubleClick={onPlanetDoubleClick}
        />
      ))}
      <mesh scale={[80, 1, 80]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <circleGeometry args={[40, 64]} />
        <meshBasicMaterial color="#050019" transparent opacity={0.6} />
      </mesh>
    </Canvas>
  );
};
