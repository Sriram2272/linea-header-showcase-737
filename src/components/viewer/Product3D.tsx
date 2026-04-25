import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

type Props = {
  shape?: string;
  color?: string;
  metallic?: boolean;
  roughness?: number;
};

const Mesh = ({ shape, color, metallic, roughness }: Required<Props>) => {
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color,
        metalness: metallic ? 0.95 : 0.2,
        roughness: Math.max(0.05, Math.min(1, roughness)),
      }),
    [color, metallic, roughness]
  );

  let geometry: JSX.Element;
  switch (shape) {
    case "ring":
      geometry = <torusGeometry args={[1, 0.18, 64, 128]} />;
      break;
    case "hoop":
      geometry = <torusGeometry args={[1.1, 0.08, 64, 128]} />;
      break;
    case "stud":
      geometry = <sphereGeometry args={[0.6, 64, 64]} />;
      break;
    case "cuff":
      geometry = <torusGeometry args={[1, 0.35, 32, 100, Math.PI * 1.3]} />;
      break;
    case "chain":
      geometry = <torusKnotGeometry args={[0.7, 0.18, 200, 32, 2, 5]} />;
      break;
    case "pendant":
      geometry = <octahedronGeometry args={[1, 0]} />;
      break;
    case "bar":
      geometry = <boxGeometry args={[2, 0.3, 0.3]} />;
      break;
    case "sphere":
      geometry = <sphereGeometry args={[1, 64, 64]} />;
      break;
    case "box":
    default:
      geometry = <boxGeometry args={[1.4, 1.4, 1.4]} />;
  }

  return (
    <mesh material={material} castShadow>
      {geometry}
    </mesh>
  );
};

const Product3D = ({ shape = "ring", color = "#c9a96e", metallic = true, roughness = 0.25 }: Props) => {
  return (
    <Canvas camera={{ position: [3, 2, 3], fov: 40 }} shadows dpr={[1, 2]}>
      <color attach="background" args={["#f5f5f3"]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
      <Mesh shape={shape} color={color} metallic={metallic} roughness={roughness} />
      <ContactShadows position={[0, -1.2, 0]} opacity={0.4} scale={6} blur={2.5} far={4} />
      <Environment preset="studio" />
      <OrbitControls enablePan={false} autoRotate autoRotateSpeed={1.2} minDistance={2.5} maxDistance={8} />
    </Canvas>
  );
};

export default Product3D;
