// src/components/ChatWindow.tsx
import { useState, useRef, useEffect } from "react";

const apiUrl = import.meta.env.VITE_API_URL as string;

interface ChatWindowProps {
  onClose: () => void;
  onResponseChange: (response: string) => void;
}

const ChatWindow = ({ onClose, onResponseChange }: ChatWindowProps) => {
  const [input, setInput] = useState("");
  const [streamedResponse, setStreamedResponse] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-expand the textarea on input change.
  useEffect(() => {
    if (textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
      textareaRef.current.style.height = "40px"; // Reset height
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        400
      )}px`;
    }
  }, [input]);

  // Listen for key events for closing chat.
  useEffect(() => {
    if (streamedResponse) {
      const handleResponseKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          setStreamedResponse("");
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
  }, [streamedResponse, onClose]);

  const handleSend = async () => {
    if (!input.trim()) {
      onClose();
      return;
    }
    // Clear previous AI response.
    onResponseChange("");
    setIsStreaming(true);
    const currentInput = input;
    setInput("");

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentInput }),
      });

      if (!res.body) {
        console.error("No response body");
        setIsStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          // Process each "data:" line in the stream.
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.trim().startsWith("data:")) {
              const jsonStr = line.replace("data:", "").trim();
              if (!jsonStr) continue;
              try {
                const parsed = JSON.parse(jsonStr);
                const candidateText =
                  parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (candidateText !== undefined) {
                  // Update the parent with the latest candidate text.
                  // setStreamedResponse(candidateText);
                  onResponseChange(candidateText);
                }
              } catch (err) {
                console.error("Error parsing JSON:", err);
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.error("Error during fetch:", err);
    }
    setIsStreaming(false);
  };

  return (
    <div
      className="absolute bottom-9 left-1/2 transform -translate-x-1/2 w-2/3 p-3 flex items-center"
      onKeyDown={(e) => e.stopPropagation()}
    >
      {streamedResponse ? (
        <div
          className="text-white px-4 py-2 rounded-3xl max-w-full"
          onClick={onClose}
        >
          {streamedResponse}
        </div>
      ) : (
        <div className="flex w-full">
          <button onClick={onClose} className="!bg-transparent w-10 h-10 !p-2">
            ✖
          </button>

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
                handleSend();
              }
            }}
            className="flex-grow text-white px-4 py-2 rounded-3xl focus:outline-none resize-none overflow-y-auto"
            placeholder="Ask me anything..."
            rows={1}
            style={{
              maxHeight: "400px",
              minHeight: "40px",
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
