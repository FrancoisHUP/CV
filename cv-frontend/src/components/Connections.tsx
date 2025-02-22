import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Cylinder } from "@react-three/drei";
import * as THREE from "three";

const Connection = ({
  start,
  end,
}: {
  start: [number, number, number];
  end: [number, number, number];
}) => {
  const ref = useRef<THREE.Mesh>(null);
  const startVec = new THREE.Vector3(...start);
  const endVec = new THREE.Vector3(...end);
  const midPoint = startVec.clone().lerp(endVec, 0.5);
  const direction = endVec.clone().sub(startVec);
  const length = direction.length();
  direction.normalize();

  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction
  );

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          varying vec2 vUv;
          void main() {
            float brightness = abs(sin(vUv.y * 10.0 + time * 3.0)); // Creates moving pulses
            gl_FragColor = vec4(0.0, 1.0, 1.0, 1.0) * brightness;
          }
        `,
      }),
    []
  );

  useFrame(({ clock }) => {
    if (ref.current) {
      material.uniforms.time.value = clock.getElapsedTime();
    }
  });

  return (
    <Cylinder
      ref={ref}
      args={[0.01, 0.01, length, 16]}
      position={midPoint.toArray()}
      quaternion={quaternion}
    >
      <primitive attach="material" object={material} />
    </Cylinder>
  );
};

export default Connection;
