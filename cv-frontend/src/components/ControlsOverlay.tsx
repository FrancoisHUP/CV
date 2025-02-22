import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const ControlsOverlay = () => {
  const [isVisible, setIsVisible] = useState(true); // Controls visibility
  const [bubbleVisible, setBubbleVisible] = useState(false); // Bubble visibility
  const [isDragging, setIsDragging] = useState(false); // Detect if dragging
  const [pressedKey, setPressedKey] = useState<string | null>(null); // Detect key press

  useEffect(() => {
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
  }, [isDragging]);

  return (
    <>
      {isVisible && (
        <div className="absolute bottom-10 right-10 flex  flex-row space-x-6 bg-black p-4 rounded-lg opacity-70 shadow-lg">
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
          {/* Mouse Drag Effect - Now on the LEFT */}
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

          {/* WASD Keyboard UI - Now on the RIGHT */}
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

      {/* Bubble Info Button */}
      {bubbleVisible && (
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
    </>
  );
};

export default ControlsOverlay;
