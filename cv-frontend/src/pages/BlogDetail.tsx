import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc, setDoc, increment } from "firebase/firestore";
import { db } from "../../firebaseConfig.ts";
import { ThumbsUp, Eye, Share } from "lucide-react";
import ShareModal from "../components/ShareModal.tsx";
interface PostType {
  id: string;
  title: string;
  content: string;
  date?: string;
  type?: "video" | "image" | "text";
  videoUrl?: string;
  imageUrl?: string;
  likes?: number;
  views?: number;
}

const BlogDetail = () => {
  const { postId } = useParams(); // Ensure your route passes the post id as "postId"
  const [post, setPost] = useState<PostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState(0);
  const [views, setViews] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postRef = doc(db, "blogPosts", postId!);
        const docSnap = await getDoc(postRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as PostType;
          const postData = { ...data, id: docSnap.id } as PostType;
          setPost(postData);

          setLikes(data.likes || 0);
          setViews(data.views || 0);
          // Increment views in Firestore
          await setDoc(postRef, { views: increment(1) }, { merge: true });
          // Update local state to reflect the new view count
          setViews((prev) => prev + 1);
        } else {
          console.error("Post not found");
        }
      } catch (error) {
        console.error("Error fetching post:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  // Like button handler with the ID converted to a string.
  const handleLike = async () => {
    if (!hasLiked && post) {
      if (!post) return;
      const postRef = doc(db, "blogPosts", String(post.id));
      try {
        await setDoc(postRef, { likes: increment(1) }, { merge: true });
        setLikes((prev) => prev + 1);
        setHasLiked(true);
      } catch (error) {
        console.error("Error updating likes:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="p-5 flex justify-center items-center">
        <p>Loading post...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-5 text-center">
        <h1>Post Not Found</h1>
        <Link to="/blogs" className="text-blue-500 hover:underline">
          ← Back to Blogs
        </Link>
      </div>
    );
  }

  // Share data.
  const shareUrl = window.location.href;
  const shareTitle = post.title;
  const shareText = post?.content?.substring(0, 100) ?? "";

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <div className="mb-4">
        <Link to="/blogs" className="text-blue-500 hover:underline">
          ← Back to Blogs
        </Link>
      </div>
      {post && (
        <>
          <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
          <small className="text-gray-500">{post.date}</small>

          {/* Render media if available */}
          {post?.type === "video" && post?.videoUrl && (
            <div className="relative pt-[56.25%] mt-4">
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
          {post?.type === "image" && post?.imageUrl && (
            <img
              src={post.imageUrl}
              alt={post.title}
              className="mt-4 max-w-full rounded"
            />
          )}

          <div className="mt-4">
            <p>{post.content}</p>
          </div>
        </>
      )}
      {/* Stats Section for Likes, Views, and Share */}
      <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
        <div className="flex items-center space-x-1 text-white">
          <Eye className="h-6 w-6 text-gray-500 mr-2" />
          <span>{views}</span>
        </div>
        <button
          onClick={handleLike}
          disabled={hasLiked}
          className={`flex items-center space-x-1 focus:outline-none ${
            hasLiked ? "opacity-50 cursor-not-allowed" : "hover:text-gray-500"
          }`}
        >
          <ThumbsUp className="h-6 w-6 text-white mr-2" />
          <span>{likes}</span>
        </button>
        <button
          onClick={() => setShareModalOpen(true)}
          className="inline-block border border-gray-300 rounded p-1 hover:bg-gray-100"
          title="Share"
        >
          <Share className="h-6 w-6 text-white" />
        </button>
      </div>

      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        shareUrl={shareUrl}
        title={shareTitle}
        text={shareText}
      />
    </div>
  );
};

export default BlogDetail;
