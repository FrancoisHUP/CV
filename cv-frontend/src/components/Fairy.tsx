import React, { useRef, useState, useEffect } from "react";
import { Sphere } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import * as THREE from "three";

const HEARING_RANGE = 10; // Maximum distance at which the fairy can hear the user
const WANDER_RADIUS = 5; // How far the fairy can wander from its start position
const MOVE_SPEED = 0.02; // Slow movement for smooth transitions
const WANDER_INTERVAL = 3; // Interval for direction change
const RETURN_SPEED = 1.5; // Speed when returning to wandering position
const CHAT_DISTANCE = 2; // Distance in front of the camera where the fairy appears

const Fairy = ({
  onChatOpen,
  isChatOpen,
}: {
  onChatOpen: () => void;
  isChatOpen: boolean;
}) => {
  const ref = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const [originalPosition] = useState(new THREE.Vector3(3, 2, -3)); // Fairy's start position
  const [wandering, setWandering] = useState(true);
  const [wanderDirection, setWanderDirection] = useState(new THREE.Vector3());

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Enter" && ref.current && !isChatOpen) {
        const userPos = new THREE.Vector3().copy(camera.position);
        const forwardDirection = new THREE.Vector3();
        camera.getWorldDirection(forwardDirection); // Get where the camera is looking

        // Calculate new position directly in front of the user
        const targetPos = userPos.add(
          forwardDirection.multiplyScalar(CHAT_DISTANCE)
        );

        // Move fairy to this new position
        setWandering(false);
        gsap.to(ref.current.position, {
          x: targetPos.x,
          y: targetPos.y,
          z: targetPos.z,
          duration: 1.5,
          ease: "power2.out",
        });

        onChatOpen(); // Open chat
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [camera, onChatOpen, isChatOpen]);

  useEffect(() => {
    if (!isChatOpen && !wandering) {
      // ✅ When chat closes, return to original position and resume wandering
      gsap.to(ref.current?.position, {
        x: originalPosition.x,
        y: originalPosition.y,
        z: originalPosition.z,
        duration: RETURN_SPEED,
        ease: "power2.out",
        onComplete: () => setWandering(true),
      });
    }
  }, [isChatOpen]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (wandering && !isChatOpen) {
        const newDirection = new THREE.Vector3(
          (Math.random() - 0.5) * MOVE_SPEED,
          (Math.random() - 0.2) * MOVE_SPEED,
          (Math.random() - 0.5) * MOVE_SPEED
        );
        setWanderDirection(newDirection);
      }
    }, WANDER_INTERVAL * 1000);

    return () => clearInterval(interval);
  }, [wandering, isChatOpen]);

  useFrame(() => {
    if (wandering && !isChatOpen && ref.current) {
      ref.current.position.add(wanderDirection);

      if (ref.current.position.distanceTo(originalPosition) > WANDER_RADIUS) {
        gsap.to(ref.current.position, {
          x: originalPosition.x,
          y: originalPosition.y,
          z: originalPosition.z,
          duration: 1.5,
          ease: "power2.out",
        });
      }
    }
  });

  return (
    <Sphere ref={ref} args={[0.2, 16, 16]} position={originalPosition}>
      <meshStandardMaterial
        color="gold"
        emissive="yellow"
        emissiveIntensity={1.5}
      />
    </Sphere>
  );
};

export default Fairy;
