import { useRef, useState, useEffect, useMemo } from "react";
import { Billboard, Html } from "@react-three/drei";
import gsap from "gsap";
import * as THREE from "three";

type NodeProps = {
  position: [number, number, number];
  title: string;
  link: string;
  exploded?: boolean;
};

const Node = ({ position, title, link, exploded = false }: NodeProps) => {
  const coreRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Compute the original position.
  const originalPos = useMemo(() => new THREE.Vector3(...position), [position]);
  // Compute an "exploded" position by scaling the original vector.
  const explosionFactor = 10; // adjust as needed
  const explodedPos = useMemo(
    () => originalPos.clone().multiplyScalar(explosionFactor),
    [originalPos]
  );

  // Animate node position when exploded state changes.
  useEffect(() => {
    if (coreRef.current) {
      const targetPos = exploded ? explodedPos : originalPos;
      gsap.to(coreRef.current.position, {
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        duration: 1,
        ease: "power2.out",
      });
    }
  }, [exploded, originalPos, explodedPos]);

  // Hover event handlers.
  const handlePointerOver = () => setIsHovered(true);
  const handlePointerOut = () => setIsHovered(false);

  // Memoize geometries.
  const coreGeometry = useMemo(() => new THREE.SphereGeometry(0.1, 16, 16), []);
  const shellGeometry = useMemo(
    () => new THREE.SphereGeometry(0.3, 16, 16),
    []
  );

  return (
    <>
      {/* Node Mesh (animated and interactive) */}
      <mesh
        ref={coreRef}
        position={originalPos.toArray()}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={() => (window.location.href = link)}
        geometry={coreGeometry}
      >
        <meshStandardMaterial
          color="cyan"
          emissive="cyan"
          emissiveIntensity={1}
        />
        {/* Label displayed only when hovered */}
        {isHovered && (
          <Billboard>
            {/* The Html component is now a child of the node mesh so it follows its position.
                The offset [0, 0.5, 0] places it above the node. */}
            <Html center position={[0, 0.5, 0]}>
              <div
                className="bg-gray-800 text-white p-2 text-sm rounded shadow-lg opacity-90 transition-opacity duration-200 ease-in-out"
                style={{ pointerEvents: "none" }}
              >
                {title}
              </div>
            </Html>
          </Billboard>
        )}
      </mesh>

      {/* Transparent shell remains at the original position */}
      {/* <mesh position={originalPos.toArray()} geometry={shellGeometry}>
        <meshPhysicalMaterial
          transparent
          opacity={0.4}
          roughness={0.1}
          clearcoat={1}
          reflectivity={1}
          transmission={0.9}aw
        />
      </mesh> */}
    </>
  );
};

export default Node;
