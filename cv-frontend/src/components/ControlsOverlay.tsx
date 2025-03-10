import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

interface ControlsOverlayProps {
  onMoveChange?: (data: { x: number; y: number }) => void;
  onRotateChange?: (data: { x: number; y: number }) => void;
  isMobile?: boolean;
}

interface TouchData {
  id: number;
  x: number;
  y: number;
}

const clamp = (val: number, min = -20, max = 20) =>
  Math.max(Math.min(val, max), min);

const ControlsOverlay = ({
  onMoveChange,
  onRotateChange,
  isMobile = false,
}: ControlsOverlayProps) => {
  // Only use overlay visibility for non-mobile
  const [isVisible, setIsVisible] = useState(true);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  // New states for joystick knob offsets
  const [leftKnob, setLeftKnob] = useState({ x: 0, y: 0 });
  const [rightKnob, setRightKnob] = useState({ x: 0, y: 0 });

  // Register mouse and keyboard events only if not mobile
  useEffect(() => {
    if (isMobile) return;
    let mouseDown = false;
    let startX = 0;
    let startY = 0;

    const handleMouseDown = (event: MouseEvent) => {
      mouseDown = true;
      startX = event.clientX;
      startY = event.clientY;
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (mouseDown) {
        const deltaX = Math.abs(event.clientX - startX);
        const deltaY = Math.abs(event.clientY - startY);
        if (deltaX > 10 || deltaY > 10) {
          setIsDragging(true);
        }
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsVisible(false);
        setBubbleVisible(true);
      }
      setIsDragging(false);
      mouseDown = false;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (["w", "a", "s", "d"].includes(event.key.toLowerCase())) {
        setPressedKey(event.key.toLowerCase());
      }
    };

    const handleKeyUp = () => {
      setPressedKey(null);
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isMobile, isDragging]);

  // Refs for joystick initial positions
  const leftStart = useRef<TouchData | null>(null);
  const rightStart = useRef<TouchData | null>(null);

  // Left joystick handlers (for user movement) with multi-touch support
  const handleLeftTouchStart = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    leftStart.current = {
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
    };
    setLeftKnob({ x: 0, y: 0 });
  };
  const handleLeftTouchMove = (e: React.TouchEvent) => {
    if (!leftStart.current) return;
    const touch = Array.from(e.touches).find(
      (t) => t.identifier === leftStart.current!.id
    );
    if (!touch) return;
    const deltaX = touch.clientX - leftStart.current.x;
    const deltaY = touch.clientY - leftStart.current.y;
    setLeftKnob({ x: clamp(deltaX), y: clamp(deltaY) });
    // Invert deltaY to fix forward/backward movement
    onMoveChange?.({ x: deltaX / 50, y: -deltaY / 50 });
  };
  const handleLeftTouchEnd = (e: React.TouchEvent) => {
    if (!leftStart.current) return;
    const touch = Array.from(e.changedTouches).find(
      (t) => t.identifier === leftStart.current!.id
    );
    if (touch) {
      leftStart.current = null;
      setLeftKnob({ x: 0, y: 0 });
      onMoveChange?.({ x: 0, y: 0 });
    }
  };

  // Right joystick handlers (for camera view) with multi-touch support
  const handleRightTouchStart = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    rightStart.current = {
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
    };
    setRightKnob({ x: 0, y: 0 });
  };
  const handleRightTouchMove = (e: React.TouchEvent) => {
    if (!rightStart.current) return;
    const touch = Array.from(e.touches).find(
      (t) => t.identifier === rightStart.current!.id
    );
    if (!touch) return;
    const deltaX = touch.clientX - rightStart.current.x;
    const deltaY = touch.clientY - rightStart.current.y;
    setRightKnob({ x: clamp(deltaX), y: clamp(deltaY) });
    onRotateChange?.({ x: deltaX / 100, y: deltaY / 100 });
  };
  const handleRightTouchEnd = (e: React.TouchEvent) => {
    if (!rightStart.current) return;
    const touch = Array.from(e.changedTouches).find(
      (t) => t.identifier === rightStart.current!.id
    );
    if (touch) {
      rightStart.current = null;
      setRightKnob({ x: 0, y: 0 });
      onRotateChange?.({ x: 0, y: 0 });
    }
  };

  return (
    <>
      {/* Render overlay UI only on non-mobile devices */}
      {!isMobile && isVisible && (
        <div className="absolute bottom-10 right-10 flex flex-row space-x-6 bg-black p-4 rounded-lg opacity-70 shadow-lg">
          {/* Close Button */}
          <button
            className="relative text-white px-2 py-1 rounded"
            onClick={() => {
              setIsVisible(false);
              setBubbleVisible(true);
            }}
          >
            ✖ Close
          </button>
          {/* Mouse Drag Effect */}
          <div className="relative flex flex-col items-center">
            <motion.div
              animate={{
                x: ["0px", "8px", "0px", "-8px", "0px"],
                y: ["0px", "4px", "8px", "4px", "0px"],
                rotate: [0, 5, 0, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-16 h-16 bg-white border-2 border-gray-700 rounded-full flex items-center justify-center shadow-md"
            >
              🖱️
            </motion.div>
            <p className="text-white text-sm mt-2">Drag to Look Around</p>
          </div>
          {/* WASD Keyboard UI */}
          <div className="relative flex flex-col items-center">
            <motion.div
              animate={{ scale: pressedKey === "w" ? 1.2 : 1 }}
              className="w-12 h-12 bg-gray-100 text-black flex items-center justify-center rounded-md"
            >
              W
            </motion.div>
            <div className="flex space-x-2 mt-1">
              {["A", "S", "D"].map((key) => (
                <motion.div
                  key={key}
                  animate={{
                    scale: pressedKey === key.toLowerCase() ? 1.2 : 1,
                  }}
                  className="w-12 h-12 bg-gray-100 text-black flex items-center justify-center rounded-md"
                >
                  {key}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {bubbleVisible && !isMobile && (
        <div className="absolute bottom-10 right-10">
          <motion.button
            className="w-12 h-12 text-white rounded-full shadow-lg flex items-center justify-center"
            onClick={() => {
              setIsVisible(true);
              setBubbleVisible(false);
            }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          >
            ❔
          </motion.button>
        </div>
      )}

      {/* Render mobile joystick controls only if isMobile is true */}
      {isMobile && (
        <>
          <div
            className="absolute"
            style={{
              bottom: "20px",
              left: "20px",
              width: 100,
              height: 100,
              background: "rgba(0,0,0,0.3)",
              borderRadius: "50%",
              touchAction: "none",
              position: "absolute",
              zIndex: 200,
            }}
            onTouchStart={handleLeftTouchStart}
            onTouchMove={handleLeftTouchMove}
            onTouchEnd={handleLeftTouchEnd}
          >
            {/* Joystick knob visual */}
            <div
              style={{
                width: 70,
                height: 70,
                background: "rgba(255,255,255,0.2)",
                borderRadius: "50%",
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: `translate(-50%, -50%) translate(${leftKnob.x}px, ${leftKnob.y}px)`,
                pointerEvents: "none",
              }}
            />
            {/* ...existing code... */}
          </div>
          <div
            className="absolute"
            style={{
              bottom: "20px",
              right: "20px",
              width: 100,
              height: 100,
              background: "rgba(0,0,0,0.3)",
              borderRadius: "50%",
              touchAction: "none",
              position: "absolute",
              zIndex: 200,
            }}
            onTouchStart={handleRightTouchStart}
            onTouchMove={handleRightTouchMove}
            onTouchEnd={handleRightTouchEnd}
          >
            {/* Joystick knob visual */}
            <div
              style={{
                width: 70,
                height: 70,
                background: "rgba(255,255,255,0.2)",
                borderRadius: "50%",
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: `translate(-50%, -50%) translate(${rightKnob.x}px, ${rightKnob.y}px)`,
                pointerEvents: "none",
              }}
            />
            {/* ...existing code... */}
          </div>
        </>
      )}
    </>
  );
};

export default ControlsOverlay;
