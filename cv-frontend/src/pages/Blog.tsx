// cv-frontend\src\pages\Blog.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  increment,
} from "firebase/firestore";
import { db } from "../../firebaseConfig.ts";
import RadialSocialMenu from "../components/RadialSocialMenu";
import { ThumbsUp, Eye, Share } from "lucide-react";
import { Link } from "react-router-dom";
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

// A custom modal component for sharing posts using react-share.
const ShareModal = ({ isOpen, onClose, shareUrl, title, text }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-60">
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
        </div>
        <button
          onClick={() => {
            navigator.clipboard
              .writeText(shareUrl)
              .then(() => alert("Link copied to clipboard!"))
              .catch(() => alert("Failed to copy link."));
          }}
          className="mb-2 px-4 py-2 border rounded text-sm hover:bg-gray-100 w-full"
        >
          Copy Link
        </button>
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

const BlogPost = ({ post }) => {
  const [expanded, setExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  // Remove view increment logic for listing; just use initial value.
  const [likes, setLikes] = useState(post.likes || 0);
  const [views] = useState(post.views || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const contentRef = useRef(null);

  // Fixed height style for collapsed state.
  const collapsedStyle = { maxHeight: "150px", overflow: "hidden" };
  const toggleExpanded = (e) => {
    // Prevent link navigation when toggling expand/collapse.
    e.stopPropagation();
    setExpanded(!expanded);
  };

  // Check if the text content overflows the container.
  useEffect(() => {
    if (contentRef.current) {
      const shouldShow =
        contentRef.current.scrollHeight > contentRef.current.clientHeight;
      setShowToggle(shouldShow);
    }
  }, [post.content]);

  // Like button handler.
  const handleLike = async (e) => {
    e.stopPropagation();
    if (!hasLiked) {
      const postDocRef = doc(db, "blogPosts", String(post.id));
      try {
        await setDoc(postDocRef, { likes: increment(1) }, { merge: true });
        setLikes((prev) => prev + 1);
        setHasLiked(true);
      } catch (error) {
        console.error("Error updating likes:", error);
      }
    }
  };

  // Open the share modal.
  const handleShare = (e) => {
    e.stopPropagation();
    setShareModalOpen(true);
  };

  // Data to share.
  const shareUrl = window.location.origin + `/blog/${post.id}`;
  const shareTitle = post.title;
  const shareText = post.content.substring(0, 100);

  return (
    <div className="border border-[#a1a1a1] rounded p-4 my-4">
      {/* Wrap main post content in a Link */}
      <Link to={`/blog/${post.id}`} className="block">
        <h2 className="text-xl font-bold">{post.title}</h2>
        <small className="text-gray-500">{post.date}</small>

        {/* Render media if available */}
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

        {/* Content container with expand/collapse functionality */}
        <div
          className="mt-2"
          style={!expanded ? collapsedStyle : {}}
          ref={contentRef}
        >
          <p>{post.content}</p>
        </div>
        {post.type === "link" && post.url && (
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline block mt-2"
            onClick={(e) => e.stopPropagation()}
          >
            Visit Link
          </a>
        )}
        {showToggle && (
          <button
            onClick={toggleExpanded}
            className="mt-2 text-blue-500 underline"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
      </Link>

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

        <button
          onClick={handleShare}
          className="inline-block border border-gray-300 rounded p-1 hover:bg-gray-100"
          title="Share"
        >
          <Share className="h-6 w-6 text-white" />
        </button>

        <div className="flex items-center space-x-1">
          <Eye className="h-6 w-6 text-gray-500 mr-2" />
          <span>{views}</span>
        </div>
      </div>

      {/* Share Modal using react-share */}
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

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 4;

  // Fetch blog posts from Firestore.
  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        const postsRef = collection(db, "blogPosts");
        const snapshot = await getDocs(postsRef);
        const postsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPosts(postsData);
      } catch (error) {
        console.error("Error fetching blog posts: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogPosts();
  }, []);

  // Pagination calculations.
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(posts.length / postsPerPage);
  const handlePageChange = (page) => setCurrentPage(page);

  if (loading) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-64px)] p-5 justify-center items-center">
        <p>Loading posts...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] p-5 relative">
      <div className="flex-grow">
        <div className="max-w-4xl mx-auto">
          {currentPosts.map((post) => (
            <BlogPost key={post.id} post={post} />
          ))}
        </div>
      </div>
      {/* Pagination Controls Always at the Bottom */}
      <div className="mt-8 flex justify-center items-center space-x-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 border border-gray-300 rounded disabled:opacity-50"
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
          <button
            key={pageNum}
            onClick={() => handlePageChange(pageNum)}
            className={`px-4 py-2 border border-gray-300 rounded ${
              currentPage === pageNum ? "bg-gray-200" : "bg-white"
            }`}
          >
            {pageNum}
          </button>
        ))}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 border border-gray-300 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <RadialSocialMenu
        radius={70}
        startAngle={190}
        endAngle={80}
        positionType="fixed"
      />
    </div>
  );
};

export default Blog;
