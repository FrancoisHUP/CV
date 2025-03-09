import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc, setDoc, increment } from "firebase/firestore";
import { db } from "../../firebaseConfig.ts";
import { ThumbsUp, Eye, Share } from "lucide-react";
import {
  FacebookShareButton,
  TwitterShareButton,
  LinkedinShareButton,
  EmailShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  EmailIcon,
} from "react-share";

// Share modal using react-share with a "Copy Link" button.
const ShareModal = ({ isOpen, onClose, shareUrl, title, text }) => {
  const [copySuccess, setCopySuccess] = useState(""); // use a string here

  const handleCopy = async () => {
    try {
      // Copy the shareUrl instead of project?.description
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess("Copied!");
      setTimeout(() => setCopySuccess(""), 2000);
    } catch (err) {
      setCopySuccess("Failed to copy!");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center ">
      <div className="bg-black rounded p-6 w-80 text-center relative">
        <h3 className="text-lg font-bold mb-4">Share this post</h3>
        <div className="flex justify-around mb-4">
          <FacebookShareButton url={shareUrl} quote={text} hashtag="#blog">
            <FacebookIcon size={48} round />
          </FacebookShareButton>
          <TwitterShareButton url={shareUrl} title={title}>
            <TwitterIcon size={48} round />
          </TwitterShareButton>
          <LinkedinShareButton url={shareUrl}>
            <LinkedinIcon size={48} round />
          </LinkedinShareButton>
          <EmailShareButton url={shareUrl} subject={title} body={text}>
            <EmailIcon size={48} round />
          </EmailShareButton>
          <button
          onClick={handleCopy}
          className="bg-gray-200 !px-3 !py-2 !rounded-full hover:bg-gray-300 transition"
          title="Copy link"
        >
          {copySuccess ? (
            <img src="/icons/check-green.svg" className="h-6 w-6" alt="Copied" />
          ) : (
            <img src="/icons/link-light.svg" className="h-6 w-6" alt="Copy" />
          )}
        </button>
        </div>
        
        <button
          onClick={onClose}
          className="mt-2 px-4 py-2 border rounded text-sm hover:bg-gray-100 w-full"
        >
          Close
        </button>
      </div>
    </div>
  );
};

const BlogDetail = () => {
  const { postId } = useParams(); // Ensure your route passes the post id as "postId"
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState(0);
  const [views, setViews] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postRef = doc(db, "blogPosts", postId);
        const docSnap = await getDoc(postRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPost({ id: docSnap.id, ...data });
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
  const shareText = post.content.substring(0, 100);

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
      <small className="text-gray-500">{post.date}</small>

      {/* Render media if available */}
      {post.type === "video" && post.videoUrl && (
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
      {post.type === "image" && post.imageUrl && (
        <img
          src={post.imageUrl}
          alt={post.title}
          className="mt-4 max-w-full rounded"
        />
      )}

      <div className="mt-4">
        <p>{post.content}</p>
      </div>

      {/* Stats Section for Likes, Views, and Share */}
      <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
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
        <div className="flex items-center space-x-1">
          <Eye className="h-6 w-6 text-gray-500 mr-2" />
          <span>{views}</span>
        </div>
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

      <div className="mt-4">
        <Link to="/blogs" className="text-blue-500 hover:underline">
          ← Back to Blogs
        </Link>
      </div>
    </div>
  );
};

export default BlogDetail;
