import { useRef, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { FlyControls } from "@react-three/drei";
import ControlsOverlay from "./ControlsOverlay";
import Particles from "./Particles";
import Fairy from "./Fairy";
import ChatWindow from "./ChatWindow";
import Node from "./Node";
import Connection from "./Connections";

type Project = {
  id: number;
  title: string;
  position: [number, number, number];
  link: string;
};

type ConnectionType = {
  from: number;
  to: number;
};

// type Connection = {
//   from: number;
//   to: number;
// };

// const projects: Project[] = [
//   { id: 1, title: "Project A", position: [2, 1, 0], link: "/project-a" },
//   { id: 2, title: "Project B", position: [-2, -1, 1], link: "/project-b" },
//   { id: 3, title: "Project C", position: [1, -2, -1], link: "/project-c" },
//   { id: 4, title: "Project D", position: [-1, 2, -1], link: "/project-d" },
// ];

// const connections: Connection[] = [
//   { from: 1, to: 2 },
//   { from: 2, to: 3 },
//   { from: 3, to: 1 },
//   { from: 1, to: 4 },
//   { from: 2, to: 4 },
// ];

const NeuronScene = () => {
  const [speed, setSpeed] = useState(10); // Default speed
  const [chatOpen, setChatOpen] = useState(false);
  const [exploded, setExploded] = useState(false);
  const controlsRef = useRef<React.ElementRef<typeof FlyControls> | null>(null);

  // State for graph data loaded from graph_3d.json
  const [graphData, setGraphData] = useState<{
    projects: Project[];
    connections: ConnectionType[];
  } | null>(null);

  // Keyboard events for chat toggle
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Enter" && !chatOpen) {
        setChatOpen(true);
      }
      if (event.key === "Escape") {
        setChatOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [chatOpen]);

  // Keyboard events to adjust movement speed
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (chatOpen) return;
      if (event.shiftKey) setSpeed(30);
    };

    const handleKeyUp = () => {
      if (!chatOpen) setSpeed(10);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [chatOpen]);

  // Update FlyControls movement speed based on chat status
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.movementSpeed = chatOpen ? 0 : speed;
    }
  }, [chatOpen, speed]);

  // Load graph data from graph_3d.json on component mount
  useEffect(() => {
    fetch("/graph_3d.json")
      .then((response) => response.json())
      .then((data) => setGraphData(data))
      .catch((error) => console.error("Error loading graph data:", error));
  }, []);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Canvas camera={{ position: [0, 0, 10], fov: 100 }}>
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={1} />

        <Particles count={1000} />
        <Fairy onChatOpen={() => setChatOpen(true)} isChatOpen={chatOpen} />

        {/* Render nodes from graph data if available */}
        {graphData &&
          graphData.projects.map((project) => (
            <Node
              key={project.id}
              position={project.position}
              title={project.title}
              link={project.link}
              exploded={exploded}
            />
          ))}

        {/* Render connections from graph data if available */}
        {/* {graphData &&
          graphData.connections.map((conn, index) => {
            const fromNode = graphData.projects.find((p) => p.id === conn.from);
            const toNode = graphData.projects.find((p) => p.id === conn.to);
            return fromNode && toNode ? (
              <Connection
                key={index}
                start={fromNode.position}
                end={toNode.position}
                exploded={exploded} // Pass the explosion state
              />
            ) : null;
          })} */}
        {/* Camera Controls */}
        <FlyControls
          ref={controlsRef}
          movementSpeed={speed}
          rollSpeed={2}
          dragToLook
        />
      </Canvas>
      {chatOpen && <ChatWindow onClose={() => setChatOpen(false)} />}
      <ControlsOverlay />

      {/* Explosion toggle button */}
      <div style={{ position: "absolute", top: 20, right: 20, zIndex: 100 }}>
        <button
          onClick={() => setExploded((prev) => !prev)}
          style={{ padding: "8px 12px" }}
        >
          {exploded ? "Reset Layout" : "Explode Nodes"}
        </button>
      </div>
    </div>
  );
};

export default NeuronScene;
