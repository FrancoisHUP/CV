// cv-frontend/src/components/Connections.tsx
import { useRef, useMemo, useEffect } from "react";
import { Cylinder } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";

type ConnectionProps = {
  start: [number, number, number];
  end: [number, number, number];
  exploded?: boolean;
};

const Connection = ({ start, end, exploded = false }: ConnectionProps) => {
  const ref = useRef<THREE.Mesh>(null);
  const explosionFactor = 10000; // Factor to scale positions when exploded is true

  // Compute effective positions based on exploded state.
  const effectivePositions = useMemo(() => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    if (exploded) {
      startVec.multiplyScalar(explosionFactor);
      endVec.multiplyScalar(explosionFactor);
    }
    return { startVec, endVec };
  }, [start, end, exploded]);

  const { startVec, endVec } = effectivePositions;

  // Compute the midpoint, length, and quaternion (rotation) for the cylinder.
  const computed = useMemo(() => {
    const midPoint = startVec.clone().lerp(endVec, 0.5);
    const direction = endVec.clone().sub(startVec);
    const length = direction.length();
    direction.normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction
    );
    return { midPoint, length, quaternion };
  }, [startVec, endVec]);

  // Store the previous midpoint so we can animate from the old value to the new one.
  const prevMidPointRef = useRef<THREE.Vector3 | null>(null);

  // Animate both position and scale changes when computed values update.
  useEffect(() => {
    if (ref.current) {
      if (prevMidPointRef.current) {
        // Animate from the previous midpoint to the current computed midpoint.
        gsap.fromTo(
          ref.current.position,
          {
            x: prevMidPointRef.current.x,
            y: prevMidPointRef.current.y,
            z: prevMidPointRef.current.z,
          },
          {
            x: computed.midPoint.x,
            y: computed.midPoint.y,
            z: computed.midPoint.z,
            duration: 1,
            ease: "power2.out",
          }
        );
      } else {
        gsap.to(ref.current.position, {
          x: computed.midPoint.x,
          y: computed.midPoint.y,
          z: computed.midPoint.z,
          duration: 1,
          ease: "power2.out",
        });
      }
      // Animate the Y scale (height) to match the computed length.
      gsap.to(ref.current.scale, {
        y: computed.length,
        duration: 1,
        ease: "power2.out",
      });
      // Update the rotation immediately (or you could animate it if needed).
      ref.current.quaternion.copy(computed.quaternion);

      // Store the current midpoint as the previous one for the next update.
      prevMidPointRef.current = computed.midPoint.clone();
    }
  }, [computed]);

  return (
    // Render a Cylinder with a fixed height (1) that gets scaled on the Y axis.
    <Cylinder
      ref={ref}
      args={[0.01, 0.01, 1, 8]} // Cylinder with fixed height of 1.
      position={computed.midPoint.toArray()}
      quaternion={computed.quaternion}
    >
      <meshBasicMaterial color="gray" />
    </Cylinder>
  );
};

export default Connection;
