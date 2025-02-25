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
  const explosionFactor = 2; // Same factor as in Node component

  // Compute effective start/end positions based on exploded state
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

  // Compute midPoint, length, and quaternion for the cylinder
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

  // Animate the cylinder when computed values change (i.e. when explosion toggles)
  useEffect(() => {
    if (ref.current) {
      gsap.to(ref.current.position, {
        x: computed.midPoint.x,
        y: computed.midPoint.y,
        z: computed.midPoint.z,
        duration: 1,
        ease: "power2.out",
      });
      // Updating quaternion directly (animation for rotation is more complex)
      ref.current.quaternion.copy(computed.quaternion);
    }
  }, [computed]);

  return (
    <Cylinder
      ref={ref}
      args={[0.01, 0.01, computed.length, 8]} // Lower segments for performance
      position={computed.midPoint.toArray()}
      quaternion={computed.quaternion}
    >
      <meshBasicMaterial color="cyan" />
    </Cylinder>
  );
};

export default Connection;
