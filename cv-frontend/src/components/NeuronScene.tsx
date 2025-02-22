import React, { useRef, useState, useEffect } from "react";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, Cylinder, Html } from "@react-three/drei";
import gsap from "gsap";
import * as THREE from "three";
import { FlyControls } from "@react-three/drei";
import ControlsOverlay from "./ControlsOverlay";
import Particles from "./Particles";
import Fairy from "./Fairy";
import ChatWindow from "./ChatWindow";

// Define project nodes (Can be loaded from JSON or API later)
const projects = [
  { id: 1, title: "Project A", position: [2, 1, 0], link: "/project-a" },
  { id: 2, title: "Project B", position: [-2, -1, 1], link: "/project-b" },
  { id: 3, title: "Project C", position: [1, -2, -1], link: "/project-c" },
  { id: 4, title: "Project D", position: [-1, 2, -1], link: "/project-d" },
];

// Define connections dynamically by referring to node IDs
const connections = [
  { from: 1, to: 2 },
  { from: 2, to: 3 },
  { from: 3, to: 1 },
  { from: 1, to: 4 },
  { from: 2, to: 4 },
];

const Node = ({ position, title, link }) => {
  const ref = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = React.useState(false); // Hover state

  // Handle hover effects
  const handleHover = (hover: boolean) => {
    setIsHovered(hover); // Update state to show/hide text
    gsap.to(ref.current?.scale, {
      x: hover ? 1.4 : 1,
      y: hover ? 1.4 : 1,
      z: hover ? 1.4 : 1,
      duration: 0.3,
    });
  };

  return (
    <>
      {/* Node (Sphere) */}
      <Sphere
        ref={ref}
        position={position}
        args={[0.3, 16, 16]}
        onPointerOver={() => handleHover(true)}
        onPointerOut={() => handleHover(false)}
        onClick={() => (window.location.href = link)}
      >
        <meshStandardMaterial
          color="cyan"
          emissive="blue"
          emissiveIntensity={0.3}
        />
      </Sphere>

      {/* Show text only when hovered */}
      {isHovered && (
        <Html position={[position[0], position[1] + 0.5, position[2]]} center>
          <div className="bg-white p-2 text-sm rounded shadow-lg opacity-75">
            {title}
          </div>
        </Html>
      )}
    </>
  );
};

const Connection = ({ start, end }) => {
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

  return (
    <Cylinder
      args={[0.05, 0.05, length, 16]}
      position={midPoint.toArray()}
      quaternion={quaternion}
    >
      <meshStandardMaterial
        color="gray"
        emissive="white"
        emissiveIntensity={0.2}
      />
    </Cylinder>
  );
};

const NeuronScene = () => {
  const [speed, setSpeed] = useState(10); // Default speed
  const [chatOpen, setChatOpen] = useState(false);
  const controlsRef = useRef<any>(null); // Reference for FlyControls
  const [responseVisible, setResponseVisible] = useState(false);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Enter" && !chatOpen) {
        setChatOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [chatOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (chatOpen) {
        return;
      }
      if (event.shiftKey) {
        setSpeed(30);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!chatOpen) {
        setSpeed(10);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [chatOpen]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.enabled = !chatOpen;

      // 🛑 Force stop movement by resetting velocity
      if (chatOpen) {
        controlsRef.current.movementSpeed = 0;
      } else {
        controlsRef.current.movementSpeed = speed;
      }
    }
  }, [chatOpen, speed]);

  return (
    <div
      style={{ width: "100%", height: "100%" }}
      // className="relative h-screen w-screen"
    >
      <Canvas camera={{ position: [0, 0, 10], fov: 100 }}>
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={1} />

        <Particles count={1000} />
        <Fairy onChatOpen={() => setChatOpen(true)} isChatOpen={chatOpen} />

        {/* Central Neuron */}
        <Sphere args={[0.6, 32, 32]}>
          <meshStandardMaterial
            color="purple"
            emissive="purple"
            emissiveIntensity={0.5}
          />
        </Sphere>
        {/* Project Nodes */}
        {projects.map((project, index) => (
          <Node
            key={index}
            position={project.position}
            title={project.title}
            link={project.link}
          />
        ))}
        {connections.map((conn, index) => {
          const fromNode = projects.find((p) => p.id === conn.from);
          const toNode = projects.find((p) => p.id === conn.to);

          return fromNode && toNode ? (
            <Connection
              key={index}
              start={fromNode.position}
              end={toNode.position}
            />
          ) : null;
        })}
        {/* Camera Controls */}
        <FlyControls
          ref={controlsRef}
          movementSpeed={speed}
          rollSpeed={2}
          dragToLook={true}
        />
      </Canvas>
      {chatOpen && (
        <ChatWindow
          onClose={() => {
            setChatOpen(false);
            setResponseVisible(false);
          }}
        />
      )}
      <ControlsOverlay />
    </div>
  );
};

export default NeuronScene;
