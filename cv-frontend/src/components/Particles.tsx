import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const Particles = ({ count = 100 }) => {
  const meshRef = useRef<THREE.Points>(null);
  const particles = useRef(new Float32Array(count * 3)).current;
  const velocities = useRef(new Float32Array(count * 3)).current;

  // Initialize positions and random movement velocities
  useEffect(() => {
    for (let i = 0; i < count * 3; i++) {
      particles[i] = (Math.random() - 0.5) * 300; // More spread out
      velocities[i] = (Math.random() - 0.5) * 0.005; // Slow movement
    }

    // Assign the generated positions to the buffer geometry
    if (meshRef.current) {
      meshRef.current.geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(particles, 3)
      );
    }
  }, []);

  // Animate particles
  useFrame(() => {
    if (meshRef.current) {
      const positions = meshRef.current.geometry.attributes.position
        .array as Float32Array;
      for (let i = 0; i < count * 3; i++) {
        positions[i] += velocities[i]; // Move particles slowly

        // Bounce effect if particles reach a limit
        if (Math.abs(positions[i]) > 20) velocities[i] *= -1;
      }

      meshRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry />
      <pointsMaterial
        color="white"
        size={0.1} // Slightly bigger
        sizeAttenuation
        transparent
        opacity={0.5} // Less opaque
      />
    </points>
  );
};

export default Particles;
