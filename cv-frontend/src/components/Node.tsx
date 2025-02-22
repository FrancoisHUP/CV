import { useRef, useState, useEffect } from "react";
import { Sphere, Html } from "@react-three/drei";
import gsap from "gsap";
import * as THREE from "three";

const Node = ({ position, title, link }) => {
  const coreRef = useRef<THREE.Mesh>(null);
  const shellRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  // Animate scale smoothly
  useEffect(() => {
    if (coreRef.current) {
      gsap.to(coreRef.current.scale, {
        x: isHovered ? 1.4 : 1,
        y: isHovered ? 1.4 : 1,
        z: isHovered ? 1.4 : 1,
        duration: 0.3,
        ease: "power1.out",
      });
    }
  }, [isHovered]);

  // Handle hover start (with small delay to prevent flickering)
  const handlePointerOver = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => {
      setIsHovered(true);
    }, 100);
  };

  // Handle hover end (with delay to prevent sudden disappearance)
  const handlePointerOut = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => {
      setIsHovered(false);
    }, 200);
  };

  return (
    <>
      {/* Glowing Core */}
      <Sphere
        ref={coreRef}
        position={position}
        args={[0.1, 32, 32]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={() => (window.location.href = link)}
      >
        <meshStandardMaterial
          color="cyan"
          emissive="cyan"
          emissiveIntensity={1}
        />
      </Sphere>

      {/* Transparent Shell */}
      <Sphere ref={shellRef} position={position} args={[0.3, 32, 32]}>
        <meshPhysicalMaterial
          transparent
          opacity={0.4}
          roughness={0.1}
          clearcoat={1}
          reflectivity={1}
          transmission={0.9}
        />
      </Sphere>

      {/* Display text when hovered (prevents flicker) */}
      {isHovered && (
        <Html position={[position[0], position[1] + 0.5, position[2]]} center>
          <div
            className="bg-gray-800 text-white p-2 text-sm rounded shadow-lg opacity-90 transition-opacity duration-200 ease-in-out"
            style={{ pointerEvents: "none" }}
          >
            {title}
          </div>
        </Html>
      )}
    </>
  );
};

export default Node;
