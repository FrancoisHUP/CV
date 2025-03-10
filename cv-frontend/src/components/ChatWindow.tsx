import { useState, useRef, useEffect } from "react";

const apiUrl = import.meta.env.VITE_API_URL as string;

interface ChatWindowProps {
  onClose: () => void;
  onResponseChange: (response: string) => void;
  onStreamingChange: (streaming: boolean) => void; // New prop for streaming status
}

const ChatWindow = ({
  onClose,
  onResponseChange,
  onStreamingChange,
}: ChatWindowProps) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    const handleResponseKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        setInput("");
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
  }, [onClose]);

  const handleSend = async () => {
    if (!input.trim()) {
      onClose();
      return;
    }
    // Clear previous AI response.
    onResponseChange("");
    onStreamingChange(true);
    const currentInput = input;
    setInput("");

    let newResponse = ""; // Local accumulator

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: currentInput }),
      });

      if (!res.body) {
        console.error("No response body");
        onStreamingChange(false);
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
          newResponse += chunk;
          onResponseChange(newResponse); // Update AI response in parent
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Error during fetch:", err.message);
      } else {
        console.error("An unknown error occurred:", err);
      }
    }
    onStreamingChange(false);
  };

  return (
    <div
      className="absolute bottom-9 left-1/2 transform -translate-x-1/2 w-2/3 p-3 flex items-center"
      onKeyDown={(e) => e.stopPropagation()}
    >
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
    </div>
  );
};

export default ChatWindow;
