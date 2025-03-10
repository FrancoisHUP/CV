import { useState, useRef, useEffect } from "react";

// Define the type for the post prop
interface BlogPostProps {
  post: {
    title: string;
    content: string;
    date: string;
    type?: "video" | "image" | "link"; // Optional post type
    videoUrl?: string;
    imageUrl?: string;
    url?: string;
  };
}

const BlogPost: React.FC<BlogPostProps> = ({ post }) => {
  const [expanded, setExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Fixed height for collapsed state.
  const collapsedStyle = {
    maxHeight: "150px",
    overflow: "hidden",
  };

  const toggleExpanded = () => setExpanded(!expanded);

  // After the component mounts, check if the content overflows the collapsed height.
  useEffect(() => {
    if (contentRef.current) {
      // When collapsed, clientHeight reflects the maxHeight of 150px.
      // scrollHeight gives the full height of the content.
      const shouldShow =
        contentRef.current.scrollHeight > contentRef.current.clientHeight;
      setShowToggle(shouldShow);
    }
  }, [post.content]);

  return (
    <div className="border border-gray-300 rounded p-4 mb-4">
      <h2 className="text-xl font-bold">{post.title}</h2>
      <small className="text-gray-500">{post.date}</small>

      {/* Render media first */}
      {post.type === "video" && post.videoUrl && (
        <div className="relative pt-[56.25%] mt-2">
          <iframe
            src={post.videoUrl}
            title={post.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full"
          ></iframe>
        </div>
      )}
      {post.type === "image" && post.imageUrl && (
        <img
          src={post.imageUrl}
          alt={post.title}
          className="mt-2 max-w-full rounded"
        />
      )}

      {/* Content container with ref */}
      <div
        className="mt-2"
        style={!expanded ? collapsedStyle : {}}
        ref={contentRef}
      >
        <p>{post.content}</p>
      </div>

      {/* External link for link posts */}
      {post.type === "link" && post.url && (
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline block mt-2"
        >
          Visit Link
        </a>
      )}

      {/* Toggle button shows only if the content overflows when collapsed */}
      {showToggle && (
        <button
          onClick={toggleExpanded}
          className="mt-2 text-blue-500 underline"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
};

export default BlogPost;
