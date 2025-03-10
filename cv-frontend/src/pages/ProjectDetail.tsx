// cv-frontend/src/pages/ProjectDetail.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Star, ThumbsUp, Eye } from "lucide-react";
import OpenOnGithub from "../components/OpenOnGithub";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  increment,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebaseConfig.ts";
import TechnologyIcon from "../components/TechnologyIcons.tsx";

interface Project {
  id: string;
  url: string;
  github_url: string;
  paper_url?: string;
  date: Timestamp | string;
  image_url: string;
  title: string;
  summary: string;
  description: string;
  collaborators?: string[];
  technologies?: string[];
  github_stars?: number;
  likes?: number;
  views?: number;
}

const ProjectDetail = () => {
  const { projectName } = useParams<{ projectName: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [likes, setLikes] = useState<number>(0);
  const [views, setViews] = useState<number>(0);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<string>("");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(project?.description || "");
      setCopySuccess("Copied!");
      setTimeout(() => setCopySuccess(""), 2000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setCopySuccess("Failed to copy!");
      } else {
        console.error("An unknown error occurred:", err);
      }
    }
  };

  // Fetch project from Firestore by matching the "url" field.
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const projectsRef = collection(db, "projects");
        // Ensure projectName is formatted correctly
        console.log("projectName", `/projects/${projectName}`);
        const q = query(
          projectsRef,
          where("url", "==", `/projects/${projectName}`)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const projectData = { id: docSnap.id, ...docSnap.data() } as Project;
          setProject(projectData);
        } else {
          console.error("Project not found in Firestore.");
        }
      } catch (error) {
        console.error("Error fetching project from Firestore:", error);
      }
    };

    if (projectName) {
      fetchProject();
    }
  }, [projectName]);

  // Once project is loaded, get its current likes and views from Firestore and update the view count.
  useEffect(() => {
    if (project) {
      const projectRef = doc(db, "projects", project.id.toString());
      const updateData = async () => {
        try {
          const docSnap = await getDoc(projectRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setLikes(data.likes || 0);
            setViews(data.views || 0);
          }
          // Increment views in Firestore
          await setDoc(projectRef, { views: increment(1) }, { merge: true });
          // Update local state to reflect the new view count
          setViews((prev) => prev + 1);
        } catch (error) {
          console.error("Error fetching/updating project data", error);
        }
      };
      updateData();
    }
  }, [project]);

  // Handle like button press
  const handleLike = async () => {
    if (project && !hasLiked) {
      const projectRef = doc(db, "projects", project.id);
      try {
        await setDoc(projectRef, { likes: increment(1) }, { merge: true });
        setLikes((prev) => prev + 1);
        setHasLiked(true);
      } catch (error) {
        console.error("Error updating likes", error);
      }
    }
  };

  if (!project) {
    return (
      <div className="p-5 flex flex-col justify-center items-center mt-10">
        <h1 className="text-3xl mb-4">Project Not Found</h1>
        <Link to="/projects" className="text-blue-500 hover:underline">
          ← Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="p-5 max-w-4xl mx-auto">
      {/* Hero Section */}
      <div
        className="h-56 bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: `url(${project.image_url})` }}
      >
        <h1 className="text-5xl md:text-7xl font-extrabold text-white drop-shadow-lg p-2 rounded-lg bg-[#0A0A0A] hover:bg-[#1A1A1A]">
          {project.title}
        </h1>
      </div>

      {/* Stats Section */}
      <div className="mt-4 flex items-center space-x-6">
        <div className="flex items-center space-x-1">
          <button
            onClick={handleLike}
            disabled={hasLiked}
            className={`flex focus:outline-none ${
              hasLiked ? "opacity-50 cursor-not-allowed" : "hover:text-gray-500"
            }`}
          >
            <ThumbsUp className="h-6 w-6 text-white mr-2" />
            <span>{likes}</span>
          </button>
        </div>
        <div className="flex items-center space-x-1">
          <span>
            <Eye className="h-6 w-6 text-gray-500 mr-2" />
          </span>
          <span>{views}</span>
        </div>
        <div className="flex items-center space-x-1">
          <span>
            <Star className="h-6 w-6 text-yellow-500 mr-2" />
          </span>
          <span>{project.github_stars || 0}</span>
        </div>
        <div>
          {new Date(
            project.date instanceof Timestamp
              ? project.date.toDate()
              : project.date
          ).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </div>
        {/* Buttons Section */}
        <div className="flex space-x-4 items-center">
          {project.github_url && (
            <OpenOnGithub githubLink={project.github_url} />
          )}
          {project.url && (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative inline-flex items-center space-x-3 px-5 py-2.5 bg-[#0A0A0A] hover:bg-[#111111] text-white rounded-lg shadow-lg transition-colors duration-300"
            >
              {/* Record-like animated dot */}
              <div className="relative">
                <span className="absolute top-1.5 inline-flex h-1/2 w-full rounded-full bg-red-600 opacity-75 animate-ping"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600"></span>
              </div>
              <span className="font-semibold">Live Demo</span>
            </a>
          )}
        </div>
      </div>

      {/* Technologies Section */}
      {project.technologies && project.technologies.length > 0 && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-4">
            {project.technologies.map((tech, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <TechnologyIcon
                  name={tech}
                  style={{ width: "24px", height: "24px" }}
                />
                <span>{tech}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Description Section */}
      <div className="mt-6 relative">
        <button
          onClick={handleCopy}
          className="absolute top-0 right-0 bg-gray-200 text-gray-800 text-xs !px-2 !py-2 rounded hover:bg-gray-300 transition"
          title="Copy raw markdown"
        >
          {copySuccess ? (
            <img
              src="/icons/check-green.svg"
              className="h-6 w-6"
              alt="Copied"
            />
          ) : (
            <img src="/icons/copy-light.svg" className="h-6 w-6" alt="Copy" />
          )}
        </button>
        <div className="prose prose-invert">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex, rehypeRaw]}
          >
            {project.description.replace(/\\n/g, "\n")}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
