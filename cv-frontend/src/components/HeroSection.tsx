// cv-frontend/src/components/HeroSection.tsx
import React, { useRef, useEffect } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseVx: number;
  baseVy: number;
  radius: number;
  flashTime: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  alpha: number;
}

const HeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ripplesRef = useRef<Ripple[]>([]);
  const nodesRef = useRef<Node[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use container dimensions
    let width = (canvas.width = container.clientWidth);
    let height = (canvas.height = container.clientHeight);

    // Initialize nodes with baseline velocities
    const numNodes = 60;
    const nodes: Node[] = [];
    for (let i = 0; i < numNodes; i++) {
      const vx = (Math.random() - 0.5) * 0.05;
      const vy = (Math.random() - 0.5) * 0.05;
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx,
        vy,
        baseVx: vx,
        baseVy: vy,
        radius: 2 + Math.random() * 3,
        flashTime: 0,
      });
    }
    nodesRef.current = nodes;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Update and draw nodes
      nodesRef.current.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off edges with new velocity calculation
        if (node.x < 0) {
          node.x = 0;
          node.vx = Math.abs(node.vx) + Math.random() * 0.01;
          node.baseVx = node.vx;
        } else if (node.x > width) {
          node.x = width;
          node.vx = -Math.abs(node.vx) - Math.random() * 0.01;
          node.baseVx = node.vx;
        }
        if (node.y < 0) {
          node.y = 0;
          node.vy = Math.abs(node.vy) + Math.random() * 0.01;
          node.baseVy = node.vy;
        } else if (node.y > height) {
          node.y = height;
          node.vy = -Math.abs(node.vy) - Math.random() * 0.01;
          node.baseVy = node.vy;
        }

        // Gradually decay node velocity toward its baseline
        const decayFactor = 0.98;
        node.vx = node.vx * decayFactor + node.baseVx * (1 - decayFactor);
        node.vy = node.vy * decayFactor + node.baseVy * (1 - decayFactor);

        // Decay flash effect
        if (node.flashTime > 0) {
          node.flashTime = Math.max(0, node.flashTime - 0.005);
        }
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        if (node.flashTime > 0.1) {
          ctx.fillStyle = `rgba(255, 220, 100, ${node.flashTime.toFixed(2)})`;
          ctx.shadowColor = `rgba(255, 220, 100, ${node.flashTime.toFixed(2)})`;
        } else {
          ctx.fillStyle = "#66eeff";
          ctx.shadowColor = "#66eeff";
        }
        // ctx.shadowBlur = 8;
        ctx.fill();
        ctx.closePath();
      });

      // Draw connections between nodes
      for (let i = 0; i < nodesRef.current.length; i++) {
        for (let j = i + 1; j < nodesRef.current.length; j++) {
          const nodeA = nodesRef.current[i];
          const nodeB = nodesRef.current[j];
          const dx = nodeA.x - nodeB.x;
          const dy = nodeA.y - nodeB.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 120) {
            const alpha = 1 - distance / 120;
            ctx.beginPath();
            ctx.moveTo(nodeA.x, nodeA.y);
            ctx.lineTo(nodeB.x, nodeB.y);
            ctx.strokeStyle = `rgba(102, 238, 255, ${alpha.toFixed(2)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.closePath();
          }
        }
      }

      // Draw ripple effects
      ripplesRef.current.forEach((ripple, index) => {
        ripple.radius += 1;
        ripple.alpha -= 0.005;
        if (ripple.alpha <= 0) {
          ripplesRef.current.splice(index, 1);
        } else {
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${ripple.alpha.toFixed(2)})`;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.closePath();
        }
      });

      requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      if (!container) return;
      width = canvas.width = container.clientWidth;
      height = canvas.height = container.clientHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Click handler attached to the outer container
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Add a new ripple effect at the click location
    ripplesRef.current.push({ x: clickX, y: clickY, radius: 0, alpha: 1 });

    // Propagate effect: push nodes away and trigger flash
    const pushThreshold = 200;
    const pushFactor = 0.5;
    nodesRef.current.forEach((node) => {
      const dx = node.x - clickX;
      const dy = node.y - clickY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < pushThreshold && distance > 0) {
        const force = ((pushThreshold - distance) / pushThreshold) * pushFactor;
        node.vx += (dx / distance) * force;
        node.vy += (dy / distance) * force;
        node.flashTime = 1;
      }
    });
  };

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className="relative w-full h-56 overflow-hidden border rounded-xl mb-8 shadow-lg"
      style={{ borderColor: "rgba(255,255,255,0.3)" }}
    >
      {/* Canvas for the neural network animation */}
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full z-0" />
      {/* Hero Content Overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4 pointer-events-none">
        <h1 className="text-5xl md:text-7xl font-extrabold text-white drop-shadow-lg mb-4">
          PROJECTS
        </h1>
      </div>
    </div>
  );
};

export default HeroSection;
