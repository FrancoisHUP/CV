import React, { useState, useRef, useEffect } from "react";

const ChatWindow = ({ onClose }: { onClose: () => void }) => {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-expand textarea but keep max height with scrolling
  useEffect(() => {
    if (textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
      textareaRef.current.style.height = "40px"; // Reset height
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        400
      )}px`; // Expand up to max height
    }
  }, [input]);
  // Listen for key events when the AI response is visible.
  useEffect(() => {
    if (response) {
      const handleResponseKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          // Dismiss the AI response and re-enable the text area
          setResponse(null);
          setTimeout(() => {
            textareaRef.current?.focus();
          }, 0);
        }
        if (event.key === "Escape") {
          onClose();
        }
      };

      window.addEventListener("keydown", handleResponseKeyDown);
      return () => {
        window.removeEventListener("keydown", handleResponseKeyDown);
      };
    }
  }, [response, onClose]);

  // Handle user input submission
  const handleSend = () => {
    if (!input.trim()) {
      onClose(); // If input is empty, close the chat
      return;
    }

    setResponse("I'm thinking..."); // Fake AI response
    setInput("");

    setTimeout(() => {
      setResponse("This is a fake AI response."); // Simulate AI response after delay
    }, 1000);
  };

  return (
    <div
      className="absolute bottom-5 left-1/2 transform -translate-x-1/2 w-2/3 p-3 flex items-center"
      onKeyDown={(e) => e.stopPropagation()}
    >
      {/* If AI response is present, show it. Otherwise, show input box */}
      {response ? (
        <div
          className="text-white px-4 py-2 rounded-3xl max-w-full"
          onClick={onClose}
        >
          {response}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Escape") {
              onClose();
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!input.trim()) {
                console.log("Should close");
                onClose(); // Closes chat if input is empty
              } else {
                console.log("Should Send", input);
                handleSend(); // Sends message if input has content
              }
            }
          }}
          className="flex-grow text-white px-4 py-2 rounded-3xl focus:outline-none resize-none overflow-y-auto"
          placeholder="Ask me anything..."
          rows={1}
          style={{
            maxHeight: "400px", // Max height for scrolling
            minHeight: "40px", // Minimum height
          }}
        />
      )}
    </div>
  );
};

export default ChatWindow;
