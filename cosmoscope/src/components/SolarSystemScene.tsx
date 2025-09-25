/* eslint-disable react/no-unknown-property */
import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, useTexture } from "@react-three/drei";
import { Color, Group, Mesh, SRGBColorSpace, Vector3, RepeatWrapping, DoubleSide } from "three";
import type { CameraMode } from "@/state/usePlanetStore";

import sunTextureUrl from "@/assets/textures/sun.jpg";
import mercuryTextureUrl from "@/assets/textures/mercury.jpg";
import venusTextureUrl from "@/assets/textures/venus.jpg";
import earthTextureUrl from "@/assets/textures/earth.jpg";
import moonTextureUrl from "@/assets/textures/moon.jpg";
import marsTextureUrl from "@/assets/textures/mars.jpg";
import jupiterTextureUrl from "@/assets/textures/jupiter.jpg";
import saturnTextureUrl from "@/assets/textures/saturn.jpg";
import saturnRingTextureUrl from "@/assets/textures/saturn_ring.png";
import uranusTextureUrl from "@/assets/textures/uranus.jpg";
import neptuneTextureUrl from "@/assets/textures/neptune.jpg";

const PLANET_DATA = [
  {
    id: "sun",
    size: 2.4,
    color: "#ffbb55",
    distance: 0,
    speed: 0,
    interactive: false,
    opacity: 1,
    rotationSpeed: 0.001,
    textureUrl: sunTextureUrl,
    emissiveColor: "#ffbb55",
    emissiveIntensity: 1.2,
  },
  {
    id: "mercury",
    size: 0.24,
    color: "#a7a39b",
    distance: 3.2,
    speed: 1.6,
    interactive: false,
    opacity: 0.9,
    rotationSpeed: 0.002,
    textureUrl: mercuryTextureUrl,
  },
  {
    id: "venus",
    size: 0.36,
    color: "#d8c388",
    distance: 4.3,
    speed: 1.1,
    interactive: false,
    opacity: 0.9,
    rotationSpeed: 0.0004,
    textureUrl: venusTextureUrl,
  },
  {
    id: "earth",
    size: 0.42,
    color: "#4a90e2",
    distance: 5.6,
    speed: 0.95,
    interactive: true,
    opacity: 1,
    rotationSpeed: 0.004,
    textureUrl: earthTextureUrl,
    tilt: 0.41,
    satellites: [
      {
        id: "moon",
        size: 0.14,
        color: "#f2f5f7",
        distance: 0.9,
        speed: 2.1,
        interactive: true,
        opacity: 1,
        rotationSpeed: 0.0025,
        textureUrl: moonTextureUrl,
        orbitOpacity: 0.2,
      },
    ],
  },
  {
    id: "mars",
    size: 0.3,
    color: "#d96c3d",
    distance: 6.9,
    speed: 0.8,
    interactive: true,
    opacity: 1,
    rotationSpeed: 0.003,
    textureUrl: marsTextureUrl,
    tilt: 0.44,
  },
  {
    id: "jupiter",
    size: 0.92,
    color: "#e0a37e",
    distance: 9.3,
    speed: 0.54,
    interactive: false,
    opacity: 0.7,
    rotationSpeed: 0.006,
    textureUrl: jupiterTextureUrl,
    tilt: 0.05,
  },
  {
    id: "saturn",
    size: 0.8,
    color: "#f5deaa",
    distance: 11.4,
    speed: 0.48,
    interactive: false,
    opacity: 0.8,
    rotationSpeed: 0.005,
    textureUrl: saturnTextureUrl,
    tilt: 0.47,
    ring: {
      innerRadius: 1.1,
      outerRadius: 1.9,
      opacity: 0.9,
      textureUrl: saturnRingTextureUrl,
      tilt: 0.35,
    },
  },
  {
    id: "uranus",
    size: 0.52,
    color: "#8dd0e0",
    distance: 13.2,
    speed: 0.42,
    interactive: false,
    opacity: 0.75,
    rotationSpeed: 0.002,
    textureUrl: uranusTextureUrl,
    tilt: 1.7,
  },
  {
    id: "neptune",
    size: 0.48,
    color: "#4b79ff",
    distance: 14.8,
    speed: 0.39,
    interactive: false,
    opacity: 0.78,
    rotationSpeed: 0.003,
    textureUrl: neptuneTextureUrl,
    tilt: 0.5,
  },
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
  selectedId?: string | null;
  tilt?: number;
  textureUrl?: string;
  rotationSpeed?: number;
  emissiveColor?: string;
  emissiveIntensity?: number;
  ring?: {
    innerRadius: number;
    outerRadius: number;
    opacity: number;
    textureUrl?: string;
    tilt?: number;
  };
  satellites?: readonly SatelliteData[];
  onClick?: (planetId: string) => void;
  onDoubleClick?: (planetId: string) => void;
}

interface SatelliteData {
  id: string;
  size: number;
  color: string;
  distance: number;
  speed: number;
  opacity: number;
  interactive: boolean;
  rotationSpeed?: number;
  textureUrl?: string;
  orbitOpacity?: number;
}

interface SatelliteMeshProps extends SatelliteData {
  selected: boolean;
  onClick?: (planetId: string) => void;
  onDoubleClick?: (planetId: string) => void;
}

const PlanetSurfaceMaterial = ({
  color,
  opacity,
  textureUrl,
  emissiveColor,
  emissiveIntensity,
}: {
  color: Color;
  opacity: number;
  textureUrl?: string;
  emissiveColor?: string;
  emissiveIntensity?: number;
}) => {
  if (!textureUrl) {
    return (
      <meshStandardMaterial
        color={color}
        transparent
        opacity={opacity}
        emissive={emissiveColor}
        emissiveIntensity={emissiveIntensity ?? 0}
      />
    );
  }

  const texture = useTexture(textureUrl);
  texture.colorSpace = SRGBColorSpace;

  return (
    <meshStandardMaterial
      map={texture}
      color={color}
      transparent
      opacity={opacity}
      emissive={emissiveColor}
      emissiveIntensity={emissiveIntensity ?? 0}
    />
  );
};

const RingMesh = ({
  innerRadius,
  outerRadius,
  opacity,
  textureUrl,
  tilt,
}: NonNullable<PlanetMeshProps["ring"]>) => {
  const texture = textureUrl ? useTexture(textureUrl) : null;

  if (texture) {
    texture.colorSpace = SRGBColorSpace;
    texture.wrapS = texture.wrapT = RepeatWrapping;
  }

  return (
    <mesh rotation={[-Math.PI / 2 + (tilt ?? 0), 0, 0]}>
      <ringGeometry args={[innerRadius, outerRadius, 128]} />
      <meshStandardMaterial
        map={texture ?? undefined}
        color="#c7bb90"
        side={DoubleSide}
        transparent
        opacity={opacity}
      />
    </mesh>
  );
};

const SatelliteMesh = ({
  id,
  size,
  color,
  distance,
  speed,
  opacity,
  interactive,
  selected,
  rotationSpeed = 0.002,
  textureUrl,
  orbitOpacity = 0.12,
  onClick,
  onDoubleClick,
}: SatelliteMeshProps) => {
  const meshRef = useRef<Mesh>(null!);
  const orbitRef = useRef<Group>(null!);
  const baseColor = useMemo(() => new Color(color), [color]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed;
    if (orbitRef.current) {
      orbitRef.current.rotation.y = t;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += rotationSpeed;
    }
  });

  return (
    <group ref={orbitRef}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[distance - 0.02, distance + 0.02, 64]} />
        <meshBasicMaterial
          color={selected ? "#00f6ff" : "#445"}
          transparent
          opacity={selected ? orbitOpacity * 1.6 : orbitOpacity}
        />
      </mesh>
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
        <PlanetSurfaceMaterial color={baseColor} opacity={opacity} textureUrl={textureUrl} />
        {selected && (
          <mesh scale={[1.5, 1.5, 1.5]}>
            <icosahedronGeometry args={[1.1, 0]} />
            <meshBasicMaterial color="#00f6ff" wireframe transparent opacity={0.5} />
          </mesh>
        )}
      </mesh>
    </group>
  );
};

const PlanetMesh = ({
  id,
  size,
  color,
  distance,
  speed,
  opacity,
  interactive,
  selectedId,
  tilt = 0,
  textureUrl,
  rotationSpeed = 0.0025,
  emissiveColor,
  emissiveIntensity,
  ring,
  satellites,
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
      meshRef.current.rotation.y += rotationSpeed;
    }
  });

  return (
    <group ref={pivotRef}>
      {distance > 0 ? (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[distance - 0.02, distance + 0.02, 64]} />
          <meshBasicMaterial
            color={selectedId === id ? "#00f6ff" : "#2c2a4a"}
            transparent
            opacity={selectedId === id ? 0.45 : 0.2}
          />
        </mesh>
      ) : null}
      <group position={[distance, 0, 0]}>
        <mesh
          ref={meshRef}
          rotation={[0, 0, tilt]}
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
          <sphereGeometry args={[1, 96, 96]} />
          <PlanetSurfaceMaterial
            color={baseColor}
            opacity={opacity}
            textureUrl={textureUrl}
            emissiveColor={emissiveColor}
            emissiveIntensity={emissiveIntensity}
          />
          {selectedId === id && (
            <mesh scale={[1.35, 1.35, 1.35]}>
              <icosahedronGeometry args={[1.1, 0]} />
              <meshBasicMaterial color="#00f6ff" wireframe transparent opacity={0.5} />
            </mesh>
          )}
        </mesh>
        {ring ? <RingMesh {...ring} /> : null}
        {satellites?.map((satellite) => (
          <SatelliteMesh
            key={satellite.id}
            {...satellite}
            selected={selectedId === satellite.id}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
          />
        ))}
      </group>
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
      <ambientLight intensity={0.35} />
      <pointLight position={[0, 0, 0]} intensity={3.4} color="#ffddaa" />
      <directionalLight position={[12, 6, 4]} intensity={0.35} color="#88aaff" />
      <directionalLight position={[-10, 4, -6]} intensity={0.25} color="#ff9f6a" />
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
          selectedId={selectedPlanetId}
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
