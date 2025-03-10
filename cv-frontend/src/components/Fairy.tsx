import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Sphere, Html, Billboard } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import * as THREE from "three";

const WANDER_RADIUS = 5;
const MOVE_SPEED = 0.02;
const WANDER_INTERVAL = 3;
const RETURN_SPEED = 1.5;
const CHAT_DISTANCE = 2;
const BOB_FADE_DURATION = 0.5; // seconds
// const PULSE_STOP_THRESHOLD = 1; // seconds without change stops pulsing

interface FairyProps {
  onChatOpen: () => void;
  isChatOpen: boolean;
  aiMessage?: string; // The current AI message text
  isStreaming: boolean; // Whether the AI response is streaming
}

const LoadingIndicator = () => {
  return (
    <div
      style={{
        width: "120px",
        height: "25px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
      }}
    >
      <div
        style={{
          width: "15px",
          height: "15px",
          backgroundColor: "white",
          animation: "morphRotate 1.5s infinite ease-in-out",
          position: "absolute",
        }}
      ></div>
      <div
        style={{
          width: "15px",
          height: "15px",
          backgroundColor: "white",
          animation: "morphRotate 1.5s infinite ease-in-out",
          position: "absolute",
          left: "15px",
        }}
      ></div>
      <div
        style={{
          width: "15px",
          height: "15px",
          backgroundColor: "white",
          animation: "morphRotate 1.5s infinite ease-in-out",
          position: "absolute",
          right: "15px",
        }}
      ></div>
      <style>
        {`
          @keyframes morphRotate {
            0% {
              border-radius: 50%;
              transform: scale(1) rotate(0deg);
              box-shadow: 0 0 5px rgba(255,255,255,0.5);
            }
            33% {
              border-radius: 20%;
              transform: scale(1.2) rotate(45deg);
              box-shadow: 0 0 15px rgba(255,255,255,0.7);
            }
            66% {
              border-radius: 0%;
              transform: scale(0.8) rotate(90deg);
              box-shadow: 0 0 10px rgba(255,255,255,0.6);
            }
            100% {
              border-radius: 50%;
              transform: scale(1) rotate(360deg);
              box-shadow: 0 0 5px rgba(255,255,255,0.5);
            }
          }
        `}
      </style>
    </div>
  );
};

const Fairy = ({
  onChatOpen,
  isChatOpen,
  aiMessage,
  isStreaming,
}: FairyProps) => {
  const ref = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const [originalPosition] = useState(() => new THREE.Vector3(3, 2, -3));
  const [wandering, setWandering] = useState(true);
  const [wanderDirection, setWanderDirection] = useState(new THREE.Vector3());
  const [hovered, setHovered] = useState(false);
  const [chatTarget, setChatTarget] = useState<THREE.Vector3 | null>(null);
  const [transitionComplete, setTransitionComplete] = useState(false);
  const [billboardFixedPosition, setBillboardFixedPosition] =
    useState<THREE.Vector3 | null>(null);
  const bobbingStartTimeRef = useRef<number | null>(null);
  const originalScale = useMemo(() => new THREE.Vector3(1, 1, 1), []);

  const triggerChat = useCallback(() => {
    if (ref.current && !isChatOpen) {
      const userPos = new THREE.Vector3().copy(camera.position);
      const forwardDirection = new THREE.Vector3();
      camera.getWorldDirection(forwardDirection);
      const targetPos = userPos
        .clone()
        .add(forwardDirection.multiplyScalar(CHAT_DISTANCE));
      setChatTarget(targetPos);
      setWandering(false);
      setTransitionComplete(false);
      gsap.to(ref.current.position, {
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        duration: 1.5,
        ease: "power2.out",
        onComplete: () => {
          if (ref.current) {
            const finalPos = ref.current.position.clone();
            setChatTarget(finalPos);
            setBillboardFixedPosition(finalPos);
          }
          bobbingStartTimeRef.current = performance.now() / 1000;
          setTransitionComplete(true);
        },
      });
      onChatOpen();
    }
  }, [camera, isChatOpen, onChatOpen]);

  const handlePointerOver = () => setHovered(true);
  const handlePointerOut = () => setHovered(false);
  const handleClick = () => triggerChat();

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Enter" && ref.current && !isChatOpen) {
        triggerChat();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [camera, onChatOpen, isChatOpen, triggerChat]);

  useEffect(() => {
    if (!isChatOpen && ref.current && !wandering) {
      setTransitionComplete(false);
      bobbingStartTimeRef.current = null;
      gsap.to(ref.current.position, {
        x: originalPosition.x,
        y: originalPosition.y,
        z: originalPosition.z,
        duration: RETURN_SPEED,
        ease: "power2.out",
        onComplete: () => {
          setWandering(true);
          setBillboardFixedPosition(null);
        },
      });
      if (ref.current) {
        ref.current.scale.copy(originalScale);
      }
    }
  }, [isChatOpen, originalPosition, wandering, originalScale]);

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
    // Wandering movement
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

    // Chat mode: bobbing effect and speaking pulse
    if (isChatOpen && chatTarget && ref.current && transitionComplete) {
      const currentTime = performance.now() / 1000;
      let alpha = 1;
      if (bobbingStartTimeRef.current !== null) {
        alpha = Math.min(
          (currentTime - bobbingStartTimeRef.current) / BOB_FADE_DURATION,
          1
        );
      }
      const elapsed = currentTime;
      const bobbingOffset = new THREE.Vector3(
        Math.sin(elapsed * 1) * 0.05 * alpha,
        Math.sin(elapsed * 1.5) * 0.05 * alpha,
        0
      );
      ref.current.position.copy(chatTarget).add(bobbingOffset);

      // Apply pulse only when streaming.
      if (isStreaming) {
        const pulse = 1 + 0.05 * Math.abs(Math.sin(elapsed * 10));
        ref.current.scale.set(pulse, pulse, pulse);
      } else {
        ref.current.scale.lerp(originalScale, 0.1);
      }
    }
  });

  return (
    <>
      <Sphere
        ref={ref}
        args={[0.2, 16, 16]}
        position={originalPosition}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <meshStandardMaterial
          color="gold"
          emissive={hovered ? "orange" : "yellow"}
          emissiveIntensity={hovered ? 2.5 : 1.5}
        />
      </Sphere>
      {isChatOpen && billboardFixedPosition && (isStreaming || aiMessage) && (
        <Billboard position={billboardFixedPosition}>
          <Html
            transform
            style={{
              pointerEvents: "none",
              transform: "translate(0%, 30px) scale(0.6)",
            }}
          >
            <div
              style={{
                pointerEvents: "auto",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                color: "white",
                padding: "5px",
                borderRadius: "5px",
                textAlign: "start",
                fontSize: "0.4rem",
                maxWidth: "300px",
                maxHeight: "100px",
                overflowY: "auto",
                WebkitFontSmoothing: "antialiased",
                MozOsxFontSmoothing: "grayscale",
              }}
            >
              <div style={{ fontFamily: "Arial" }}>
                {aiMessage ? aiMessage : <LoadingIndicator />}
              </div>
            </div>
          </Html>
        </Billboard>
      )}
    </>
  );
};

export default Fairy;
