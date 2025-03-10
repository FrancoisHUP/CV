// import React, { useRef, useEffect, useState } from "react";
// import { Sphere, Html, shaderMaterial } from "@react-three/drei";
// import { useFrame, useThree, extend } from "@react-three/fiber";
// import gsap from "gsap";
// import * as THREE from "three";

// const HEARING_RANGE = 10; // Maximum distance at which the fairy can hear the user
// const WANDER_RADIUS = 5; // How far the fairy can wander from its start position
// const MOVE_SPEED = 0.05; // Speed at which the fairy moves
// const RETURN_SPEED = 0.1; // Speed at which it moves towards the user when called

// const TRAIL_LENGTH = 20; // Number of trail particles
// const TRAIL_FADE_SPEED = 0.02; // Fade speed of the particles
// const TRAIL_RANDOMNESS = 0.1; // Random wobble intensity

// // ✅ Custom Shader Material for a glowing and pulsating effect
// const FairyMaterial = shaderMaterial(
//   {
//     time: 0,
//     color: new THREE.Color(0xffffff), // Gold color
//   },
//   // Vertex Shader (pulsating effect)
//   `
//   varying vec3 vNormal;
//   uniform float time;
//   void main() {
//     vNormal = normal;
//     vec3 pos = position;
//     pos *= (1.0 + 0.1 * sin(time * 3.0)); // Pulsate effect
//     gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
//   }
//   `,
//   // Fragment Shader (emissive glow effect)
//   `
//   varying vec3 vNormal;
//   uniform float time;
//   uniform vec3 color;
//   void main() {
//     float glow = abs(sin(time * 2.0)) * 0.5 + 0.5; // Smooth pulsating glow
//     gl_FragColor = vec4(color * glow, 0.9); // Adjust alpha for a softer effect
//   }
//   `
// );

// extend({ FairyMaterial });

// // ✅ FIX: Register the custom material in JSX Intrinsic Elements
// declare global {
//   namespace JSX {
//     interface IntrinsicElements {
//       fairyMaterial: any;
//     }
//   }
// }

// const Fairy = ({ onChatOpen }: { onChatOpen: () => void }) => {
//   const ref = useRef<THREE.Mesh>(null);
//   const materialRef = useRef<THREE.ShaderMaterial>(null);
//   const { camera } = useThree();
//   const [hovered, setHovered] = useState(false);
//   const trailRefs = useRef<THREE.Mesh[]>([]);
//   const [targetPosition, setTargetPosition] = useState(
//     new THREE.Vector3(3, 2, -3)
//   ); // Start position
//   const [wandering, setWandering] = useState(true);

//   const trailPositions = useRef(new Array(TRAIL_LENGTH).fill([0, 1, -2]));

//   useEffect(() => {
//     const handleKeyPress = (event: KeyboardEvent) => {
//       if (event.key === "Enter" && ref.current) {
//         const userPos = new THREE.Vector3().copy(camera.position);
//         const fairyPos = new THREE.Vector3().copy(ref.current.position);

//         // Calculate distance to user
//         const distance = fairyPos.distanceTo(userPos);

//         if (distance <= HEARING_RANGE) {
//           // Move toward user using shortest path
//           setWandering(false);
//           gsap.to(ref.current.position, {
//             x: userPos.x + Math.random() * 1 - 0.5,
//             y: userPos.y + 1.5,
//             z: userPos.z + Math.random() * 1 - 0.5,
//             duration: 1.5,
//             ease: "power2.out",
//             onComplete: () => setWandering(true),
//           });
//           onChatOpen();
//         }
//       }
//     };

//     window.addEventListener("keydown", handleKeyPress);
//     return () => {
//       window.removeEventListener("keydown", handleKeyPress);
//     };
//   }, [camera, onChatOpen]);

//   useFrame(() => {
//     if (wandering && ref.current) {
//       const wanderOffset = new THREE.Vector3(
//         (Math.random() - 0.5) * 0.05,
//         (Math.random() - 0.5) * 0.05,
//         (Math.random() - 0.5) * 0.05
//       );

//       // Move the fairy within the defined wandering radius
//       let nextPosition = new THREE.Vector3()
//         .copy(ref.current.position)
//         .add(wanderOffset);

//       // Ensure it stays within its allowed radius
//       if (nextPosition.distanceTo(targetPosition) > WANDER_RADIUS) {
//         nextPosition.lerp(targetPosition, 0.05);
//       }

//       ref.current.position.copy(nextPosition);
//     }
//   });
//   //   // Update fairy position to follow the user
//   //   useFrame((state) => {
//   //     if (ref.current && materialRef.current) {
//   //       materialRef.current.uniforms.time.value = state.clock.getElapsedTime();
//   //       ref.current.scale.setScalar(
//   //         1 + 0.05 * Math.sin(state.clock.elapsedTime * 4)
//   //       ); // Pulsating effect
//   //     }
//   //     if (ref.current) {
//   //       const targetPos = new THREE.Vector3().copy(camera.position);
//   //       targetPos.z -= 2; // Keep it in front of the user
//   //       gsap.to(ref.current.position, {
//   //         x: targetPos.x + Math.sin(performance.now() * 0.001) * 0.5,
//   //         y: targetPos.y + Math.cos(performance.now() * 0.001) * 0.5,
//   //         z: targetPos.z,
//   //         duration: 0.5,
//   //         ease: "power2.out",
//   //       });

//   //       // Update the trail positions
//   //       trailPositions.current.unshift([...ref.current.position.toArray()]);
//   //       if (trailPositions.current.length > TRAIL_LENGTH) {
//   //         trailPositions.current.pop();
//   //       }

//   //       // Update the trail meshes with glowing and random movement
//   //       trailRefs.current.forEach((trail, i) => {
//   //         if (trail) {
//   //           const offsetX = (Math.random() - 0.5) * TRAIL_RANDOMNESS;
//   //           const offsetY = (Math.random() - 0.5) * TRAIL_RANDOMNESS;
//   //           const offsetZ = (Math.random() - 0.5) * TRAIL_RANDOMNESS;

//   //           gsap.to(trail.position, {
//   //             x: trailPositions.current[i][0] + offsetX,
//   //             y: trailPositions.current[i][1] + offsetY,
//   //             z: trailPositions.current[i][2] + offsetZ,
//   //             duration: 0.1,
//   //           });

//   //           // Adjust opacity and emissive intensity for a glowing effect
//   //           const alpha = 1 - i / TRAIL_LENGTH;
//   //           trail.material.opacity = Math.max(alpha - TRAIL_FADE_SPEED, 0);
//   //           trail.material.emissiveIntensity = alpha * 2; // Makes older trails glow more
//   //         }
//   //       });
//   //     }
//   //   });

//   return (
//     <>
//       {/* ✅ Pulsating Fairy with Animated Glow */}
//       <Sphere
//         ref={ref}
//         args={[0.05, 32, 32]}
//         onPointerOver={() => setHovered(true)}
//         onPointerOut={() => setHovered(false)}
//         onClick={onChatOpen}
//       >
//         <fairyMaterial ref={materialRef} attach="material" />
//       </Sphere>

//       {/* ✅ Glowing Particle Trail */}
//       {trailPositions.current.map((pos, index) => (
//         <Sphere
//           key={index}
//           ref={(el) => {
//             if (el) trailRefs.current[index] = el;
//           }}
//           args={[0.01, 8, 8]} // Smaller particles for the trail
//           position={pos}
//         >
//           <meshStandardMaterial
//             color="cyan"
//             emissive="blue"
//             emissiveIntensity={1}
//             transparent
//             opacity={0.5}
//           />
//         </Sphere>
//       ))}

//       {/* ✅ Tooltip when hovering */}
//       {hovered && (
//         <Html position={[0, 0.5, -2]} center>
//           <div className="bg-white p-2 text-sm rounded shadow-lg opacity-75">
//             Click to Chat
//           </div>
//         </Html>
//       )}
//     </>
//   );
// };

// export default Fairy;
