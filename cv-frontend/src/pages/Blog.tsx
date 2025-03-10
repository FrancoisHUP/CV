// cv-frontend\src\pages\Blog.tsx
import { useState, useEffect, useRef } from "react";
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
import ShareModal from "../components/ShareModal.tsx";

type PostType = {
  id: string;
  title: string;
  content: string;
  date?: string;
  type?: "video" | "image" | "text" | "link";
  videoUrl?: string;
  imageUrl?: string;
  url?: string;
  likes?: number;
  views?: number;
};

const BlogPost: React.FC<{ post: PostType }> = ({ post }) => {
  const [expanded, setExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  // Remove view increment logic for listing; just use initial value.
  const [likes, setLikes] = useState(post.likes || 0);
  const [views] = useState(post.views || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Fixed height style for collapsed state.
  const collapsedStyle = { maxHeight: "150px", overflow: "hidden" };
  const toggleExpanded = (e: React.MouseEvent<HTMLButtonElement>) => {
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
  const handleLike = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
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
  const handleShare = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setShareModalOpen(true);
  };

  // Data to share.
  const shareUrl = window.location.origin + `/blog/${post.id}`;
  const shareTitle = post.title;
  const shareText = post.content.substring(0, 100);

  return (
    <div className="border border-[#a1a1a1] rounded p-4 my-4 opacity-80 group hover:bg-gray-100  transition-colors duration-300">
      {/* Wrap main post content in a Link */}
      <Link to={`/blog/${post.id}`} className="block">
        <h2 className="text-xl font-bold group-hover:text-black">
          {post.title}
        </h2>
        <small className="text-gray-500 group-hover:text-black">
          {post.date}
        </small>

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
          <p className="group-hover:text-black">{post.content}</p>
        </div>
        {post.type === "link" && post.url && (
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline block mt-2 group-hover:text-black"
            onClick={(e) => e.stopPropagation()}
          >
            Visit Link
          </a>
        )}
        {showToggle && (
          <button
            onClick={toggleExpanded}
            className="mt-2 text-blue-500 underline group-hover:text-black"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
        {/* Stats Section for Likes, Views, and Share */}
        <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600 group-hover:text-black ">
          <div className="flex items-center space-x-1 text-white group-hover:text-black">
            <Eye className="h-6 w-6 text-gray-500 mr-2" />
            <span>{views}</span>
          </div>
          <button
            onClick={handleLike}
            disabled={hasLiked}
            className={`flex items-center space-x-1 focus:outline-none  ${
              hasLiked
                ? " cursor-not-allowed text-white"
                : "hover:text-gray-500"
            }`}
          >
            <ThumbsUp className="h-6 w-6 text-white mr-2 h" />
            <span className="ml-1 text-white">{likes}</span>
          </button>

          <button
            onClick={handleShare}
            className="inline-block border border-gray-300 rounded p-1 hover:bg-gray-100"
            title="Share"
          >
            <Share className="h-6 w-6 text-white" />
          </button>
        </div>
      </Link>
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
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 4;

  // Fetch blog posts from Firestore.
  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        const postsRef = collection(db, "blogPosts");
        const snapshot = await getDocs(postsRef);
        const postsData: PostType[] = snapshot.docs.map((doc) => {
          const data = doc.data() as PostType;
          return { ...data, id: doc.id };
        });
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
  const handlePageChange = (page: number) => setCurrentPage(page);

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
