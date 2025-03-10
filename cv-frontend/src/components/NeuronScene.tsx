import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { FlyControls as DreiFlyControls } from "@react-three/drei";
import { FlyControls as ThreeFlyControls } from "three-stdlib";
import ControlsOverlay from "./ControlsOverlay";
import Particles from "./Particles";
import Fairy from "./Fairy";
import ChatWindow from "./ChatWindow";
import Node from "./Node";
import Connection from "./Connections";
import InfoPanel from "./InfoPanel";
import { useThree } from "@react-three/fiber";

export type NodeType = {
  id: string;
  name: string;
  label?: string;
  position: [number, number, number];
  color: string;
  size: number;
  link?: string;
  type: string;
  parentId?: string;
  details?: string;
  last_modified?: string;
  children?: NodeType[];
};

type ConnectionType = {
  from: string;
  to: string;
};

type FlattenedGraph = {
  nodes: NodeType[];
  connections: ConnectionType[];
};

function flattenTree(root: NodeType): FlattenedGraph {
  const nodes: NodeType[] = [];
  const connections: ConnectionType[] = [];
  function traverse(node: NodeType, parentId?: string) {
    const currentNode: NodeType = {
      id: node.id,
      name: node.name,
      position: node.position,
      color: node.color,
      size: node.size,
      link: node.link,
      type: node.type,
      parentId: parentId,
      details: node.details,
      last_modified: node.last_modified,
    };
    nodes.push(currentNode);
    if (parentId) {
      connections.push({ from: parentId, to: node.id });
    }
    if (node.children && node.children.length > 0) {
      node.children.forEach((child: NodeType) => traverse(child, node.id));
    }
  }
  traverse(root);
  return { nodes, connections };
}

const CameraController = ({
  controlsRef,
  mobileMove,
  mobileRotate,
}: {
  controlsRef: React.MutableRefObject<ThreeFlyControls | null>;
  mobileMove: { x: number; y: number };
  mobileRotate: { x: number; y: number };
}) => {
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  useFrame((_, delta) => {
    if (controlsRef.current) {
      const { camera } = useThree();
      camera.translateX(mobileMove.x * delta);
      camera.translateZ(-mobileMove.y * delta);
      yawRef.current -= mobileRotate.x * delta;
      pitchRef.current -= mobileRotate.y * delta;
      pitchRef.current = Math.max(
        Math.min(pitchRef.current, Math.PI / 2 - 0.1),
        -Math.PI / 2 + 0.1
      );
      camera.rotation.set(pitchRef.current, yawRef.current, 0);
    }
  });
  return null;
};

const NeuronScene = () => {
  const [speed, setSpeed] = useState(10);
  const [chatOpen, setChatOpen] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [labelsActive, setLabelsActive] = useState(false);
  const controlsRef = useRef<ThreeFlyControls | null>(null);
  const [graphData, setGraphData] = useState<FlattenedGraph | null>(null);
  const [mobileMove, setMobileMove] = useState({ x: 0, y: 0 });
  const [mobileRotate, setMobileRotate] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<NodeType | null>(null);
  const [_, setHoveredNode] = useState<NodeType | null>(null);
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  useEffect(() => {
    const handleGlobalMouseUp = (event: MouseEvent) => {
      if (!event.isTrusted) return;
      const canvas = document.querySelector("canvas");
      if (canvas) {
        canvas.dispatchEvent(new MouseEvent("mouseup", { bubbles: false }));
      }
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  useEffect(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    const handlePointerLeave = () => {
      canvas.dispatchEvent(new PointerEvent("pointerup", { bubbles: false }));
    };
    const handleWindowBlur = () => {
      canvas.dispatchEvent(new PointerEvent("pointerup", { bubbles: false }));
    };
    canvas.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("blur", handleWindowBlur);
    return () => {
      canvas.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, []);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (selectedNode) {
          setSelectedNode(null);
        } else {
          setChatOpen(false);
          setAiResponse("");
        }
      }
      if (event.key === "Enter" && !chatOpen) setChatOpen(true);
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [chatOpen, selectedNode]);

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

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.movementSpeed = chatOpen ? 0 : speed;
    }
  }, [chatOpen, speed]);

  useEffect(() => {
    if (exploded) {
      const timer = setTimeout(() => setLabelsActive(true), 1500);
      return () => clearTimeout(timer);
    } else {
      setLabelsActive(false);
    }
  }, [exploded]);

  useEffect(() => {
    fetch("/graph_3d.json")
      .then((response) => response.json())
      .then((data) => {
        if (data.root) {
          const flattened = flattenTree(data.root);
          setGraphData(flattened);
        } else {
          console.error("No 'root' key found in the JSON data.");
        }
      })
      .catch((error) => console.error("Error loading graph data:", error));
  }, []);

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 100 }}
        dpr={[window.devicePixelRatio, 2]}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={1} />
        <Particles count={1000} />
        <Fairy
          onChatOpen={() => setChatOpen(true)}
          isChatOpen={chatOpen}
          aiMessage={aiResponse}
          isStreaming={isStreaming}
        />
        {graphData &&
          graphData.nodes.map((node) => {
            const isRoot =
              node.id === "francoisHUP" || node.name === "FrancoisHUP";
            return (
              <Node
                key={node.id}
                data={{ ...node, label: node.name }}
                position={[
                  node.position[0] / 1000,
                  node.position[1] / 1000,
                  node.position[2] / 1000,
                ]}
                title={node.name}
                color={node.color}
                size={node.size}
                link={node.link || ""}
                exploded={exploded}
                labelsActive={labelsActive}
                onRootClick={
                  isRoot ? () => setExploded((prev) => !prev) : undefined
                }
                onSelect={
                  !isRoot
                    ? (nodeData: NodeType) => setSelectedNode(nodeData)
                    : undefined
                }
                onHover={
                  !selectedNode
                    ? (nodeData) => setHoveredNode(nodeData)
                    : undefined
                }
                onHoverOut={
                  !selectedNode ? () => setHoveredNode(null) : undefined
                }
              />
            );
          })}
        {graphData &&
          graphData.connections.map((conn, index) => {
            const fromNode = graphData.nodes.find((n) => n.id === conn.from);
            const toNode = graphData.nodes.find((n) => n.id === conn.to);
            if (fromNode && toNode) {
              const startPos = fromNode.position.map((p) => p / 1000) as [
                number,
                number,
                number
              ];
              const endPos = toNode.position.map((p) => p / 1000) as [
                number,
                number,
                number
              ];
              return (
                <Connection
                  key={index}
                  start={startPos}
                  end={endPos}
                  exploded={exploded}
                />
              );
            }
            return null;
          })}
        <DreiFlyControls
          ref={controlsRef}
          movementSpeed={chatOpen ? 0 : speed}
          rollSpeed={2}
          dragToLook
        />
        {isMobile && (
          <CameraController
            controlsRef={controlsRef}
            mobileMove={mobileMove}
            mobileRotate={mobileRotate}
          />
        )}
      </Canvas>
      {chatOpen && (
        <ChatWindow
          onClose={() => {
            setChatOpen(false);
            setAiResponse("");
          }}
          onResponseChange={setAiResponse}
          onStreamingChange={setIsStreaming}
        />
      )}
      <ControlsOverlay
        onMoveChange={setMobileMove}
        onRotateChange={setMobileRotate}
        isMobile={isMobile}
      />
      {selectedNode && graphData && (
        <InfoPanel
          activeNode={selectedNode}
          graphNodes={graphData.nodes}
          onClose={() => {
            setSelectedNode(null);
            setHoveredNode(null);
          }}
        />
      )}
    </div>
  );
};

export default NeuronScene;
