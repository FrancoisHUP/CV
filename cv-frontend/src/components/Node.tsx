import { useRef, useState, useEffect, useMemo } from "react";
import { Billboard, Html } from "@react-three/drei";
import gsap from "gsap";
import * as THREE from "three";

type NodeProps = {
  data: any; // Ideally, type this as NodeType.
  position: [number, number, number];
  title: string;
  color: string;
  size: number;
  link: string;
  exploded?: boolean;
  labelsActive?: boolean;
  onRootClick?: () => void;
  onSelect?: (node: any) => void;
  onHover?: (node: any) => void;
  onHoverOut?: () => void;
};

const Node = ({
  data,
  position,
  title,
  color,
  size,
  link,
  exploded = false,
  labelsActive = false,
  onRootClick,
  onSelect,
  onHover,
  onHoverOut,
}: NodeProps) => {
  const coreRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);

  const originalPos = useMemo(() => new THREE.Vector3(...position), [position]);
  const explosionFactor = 10000;
  const explodedPos = useMemo(
    () => originalPos.clone().multiplyScalar(explosionFactor),
    [originalPos]
  );

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

  const shouldShowLabel =
    ((exploded && labelsActive) || onRootClick) && isHovered;

  const handlePointerOver = () => {
    setIsHovered(true);
    if (onHover) onHover(data);
  };

  const handlePointerOut = () => {
    setIsHovered(false);
    if (onHoverOut) onHoverOut();
  };

  const coreGeometry = useMemo(
    () => new THREE.SphereGeometry(size, 16, 16),
    [size]
  );

  const handleClick = () => {
    if (onRootClick) {
      onRootClick();
    } else if (onSelect) {
      onSelect(data);
    }
  };

  return (
    <mesh
      ref={coreRef}
      position={originalPos.toArray()}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={exploded || onRootClick ? handleClick : undefined}
      geometry={coreGeometry}
    >
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1}
      />
      {shouldShowLabel && (
        <Billboard>
          <Html
            center
            position={[0, 0.8, 0]}
            pointerEvents="none"
            distanceFactor={20} // adjust as needed for consistent scale
          >
            <div className="bg-gray-800 text-white p-2 text-sm rounded shadow-lg opacity-90 transition-opacity duration-200 ease-in-out">
              {title}
            </div>
          </Html>
        </Billboard>
      )}
    </mesh>
  );
};

export default Node;
