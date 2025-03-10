// cv-frontend/src/pages/Projects.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, ThumbsUp, Eye } from "lucide-react";
import HeroSection from "../components/HeroSection";
import { db } from "../../firebaseConfig.ts"; // Your Firebase config file
import { collection, getDocs, Timestamp } from "firebase/firestore";

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

const sortOptions = [
  { label: "Newest", value: "date_desc" },
  { label: "Oldest", value: "date_asc" },
  { label: "Most Stars", value: "github_stars_desc" },
  { label: "Most Views", value: "views_desc" },
];

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("date_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 50;

  // Fetch projects from Firestore on mount.
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectsRef = collection(db, "projects");
        const snapshot = await getDocs(projectsRef);
        const projectsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Project, "id">),
        }));
        setProjects(projectsData);
        console.log(projectsData);
      } catch (error) {
        console.error("Error fetching projects: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Filter projects by title, summary, or description.
  const filteredProjects = projects.filter(
    (project) =>
      (project.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.summary || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (project.description || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  // Sort projects.
  const sortedProjects = filteredProjects.sort((a, b) => {
    switch (sortOption) {
      case "date_asc":
        return (
          new Date(
            a.date instanceof Timestamp ? a.date.toDate() : a.date
          ).getTime() -
          new Date(
            b.date instanceof Timestamp ? b.date.toDate() : b.date
          ).getTime()
        );
      case "date_desc":
        return (
          new Date(
            b.date instanceof Timestamp ? b.date.toDate() : b.date
          ).getTime() -
          new Date(
            a.date instanceof Timestamp ? a.date.toDate() : a.date
          ).getTime()
        );
      case "github_stars_desc":
        return (b.github_stars || 0) - (a.github_stars || 0);
      case "views_desc":
        return (b.views || 0) - (a.views || 0);
      default:
        return 0;
    }
  });

  // Pagination calculations.
  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = sortedProjects.slice(
    indexOfFirstProject,
    indexOfLastProject
  );
  const totalPages = Math.ceil(sortedProjects.length / projectsPerPage);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (option: string) => {
    setSortOption(option);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-64px)] p-5">
        <HeroSection />
        <div className="flex-grow text-center">Loading projects...</div>
      </div>
    );
  }

  return (
    // Adjust min-height to account for the navbar height (64px here)
    <div className="flex flex-col min-h-[calc(100vh-64px)] p-5">
      <HeroSection />
      <div className="flex-grow">
        <div className="mb-6 flex flex-col justify-between sm:flex-row sm:items-center sm:space-x-4">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="border rounded px-3 py-2 mb-3 sm:mb-0"
            style={{ borderColor: "rgba(255,255,255,0.3)" }}
          />

          <div className="flex flex-wrap gap-2">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSortChange(option.value)}
                className={`px-4 py-2 border rounded bg-white ${
                  sortOption === option.value
                    ? "active-sort"
                    : "border-gray-300 hover:bg-gray-100"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {currentProjects.map((project, index) => (
            <div
              key={project.id || index}
              className="border border-animate rounded overflow-hidden shadow hover:shadow-lg"
            >
              <Link
                to={
                  project.url ||
                  `/projects/${(project.title || "")
                    .toLowerCase()
                    .replace(/\s+/g, "-")}`
                }
                className="block"
              >
                <img
                  src={project.image_url}
                  alt={project.title}
                  className="w-full h-50 object-cover"
                />
                <div className="p-2 bg-[#1A1A1A]">
                  <h2 className="text-xl font-semibold mb-2">
                    {project.title}
                    <p className="text-gray-500 text-sm mb-2">
                      {new Date(
                        project.date instanceof Timestamp
                          ? project.date.toDate()
                          : project.date
                      ).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </h2>
                  <div className="flex flex-wrap items-center space-x-4 text-sm text-gray-600">
                    {project.github_stars !== undefined && (
                      <span className="flex items-center">
                        <Star className="h-6 w-6 text-yellow-500 mr-2" />
                        {project.github_stars}
                      </span>
                    )}
                    {project.likes !== undefined && (
                      <span className="flex items-center">
                        <ThumbsUp className="h-6 w-6 text-blue-500 mr-2" />
                        {project.likes}
                      </span>
                    )}
                    {project.views !== undefined && (
                      <span className="flex items-center">
                        <Eye className="h-6 w-6 text-gray-500 mr-2" />
                        {project.views}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
      {/* Pagination Controls Always at the Bottom of the Component */}
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
    </div>
  );
};

export default Projects;
