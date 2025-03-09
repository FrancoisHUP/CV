import React, { useEffect, useState } from "react";
import { db } from "../../firebaseConfig.ts"; // Adjust the path to your Firebase config file
import { collection, getDocs } from "firebase/firestore";

interface Project {
  id: string;
  url: string;
  github_url: string;
  paper_url?: string;
  date: string;
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

const ProjectsSection = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectsRef = collection(db, "projects");
        const snapshot = await getDocs(projectsRef);
        const projectsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Project, "id">),
        }));
        // Sort projects by date descending (newest first)
        const sortedProjects = projectsData.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        // Take only the three most recent projects
        setProjects(sortedProjects.slice(0, 3));
      } catch (error) {
        console.error("Error fetching projects: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return (
      <p style={{ textAlign: "center", padding: "50px" }}>
        Loading projects...
      </p>
    );
  }

  return (
    <div>
      {projects.map((project, index) => {
        // Alternate layout: even index => image on left, odd index => image on right.
        const isImageLeft = index % 2 === 0;
        const backgroundColor = index % 2 === 0 ? "#252525" : "rgb(10, 10, 10)";

        return (
          <section
            key={project.id}
            style={{
              backgroundColor,
              minHeight: "50vh",
              display: "flex",
              alignItems: "center",
              padding: "50px 20px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: isImageLeft ? "row" : "row-reverse",
                alignItems: "center",
                gap: "20px",
                width: "100%",
                maxWidth: "1200px",
                margin: "0 auto",
              }}
            >
              {/* Project Image */}
              <div style={{ width: "400px", padding: "20px" }}>
                <img
                  src={project.image_url}
                  alt={project.title}
                  style={{
                    width: "100%",
                    height: "auto",
                    borderRadius: "8px",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                    objectFit: "cover",
                  }}
                />
              </div>

              {/* Project Description */}
              <div style={{ flex: "1", padding: "20px" }}>
                <h3 className="text-4xl tracking-widest my-2">
                  {project.title}
                </h3>
                <p className="my-4">{project.summary}</p>
                <button
                  className="mt-6"
                  onClick={() => (window.location.href = project.url)}
                  style={{
                    padding: "10px 20px",
                    border: "none",
                    borderRadius: "4px",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  View Project
                </button>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default ProjectsSection;
