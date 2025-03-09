import React from "react";
import TechnologyBanner from "../components/TechnologyBanner";
import ProjectsSection from "../components/ProjectsSection";
import RadialSocialMenu from "../components/RadialSocialMenu";
import { useNavigate } from "react-router-dom";

const Portfolio = () => {
  const navigate = useNavigate();

  return (
    <div>
      {/* Landing Section */}
      <section
        id="landing"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
          backgroundColor: "#0A0A0A",
          color: "#fff",
          padding: "0 20px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            maxWidth: "900px",
            width: "100%",
            gap: "40px",
          }}
        >
          {/* Left Column: Profile Image */}
          <div style={{ flex: "0 0 auto" }}>
            <img
              src="../images/profile.jpg"
              alt="Profile"
              style={{
                borderRadius: "50%",
                width: "300px",
                height: "300px",
                objectFit: "cover",
                border: "5px solid #333",
              }}
            />
          </div>
          {/* Right Column: Text and Buttons */}
          <div style={{ flex: "1", textAlign: "left" }}>
            <h1
              style={{
                fontSize: "3rem",
                marginBottom: "20px",
                letterSpacing: "2px",
              }}
            >
              François Huppé-Marcoux
            </h1>
            <p
              style={{
                fontSize: "1.25rem",
                marginBottom: "30px",
                lineHeight: "1.6",
                wordSpacing: "2px",
                letterSpacing: "1px",
              }}
            >
              AI/Machine learning engineer & Sofware engineer
            </p>
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
              <button onClick={() => navigate("/projects")}>🖥️ Projects</button>
              <button
                onClick={() =>
                  window.open(
                    "https://www.researchgate.net/profile/Francois-Huppe-Marcoux",
                    "_blank"
                  )
                }
              >
                📝 Papers
              </button>
              <button onClick={() => navigate("/blogs")}>🖊️ Blogs</button>
            </div>
          </div>
        </div>
      </section>
      {/* Projects Section */}
      <ProjectsSection />
      <div className="flex items-center justify-center">
        <div className="bg-[#A1A1A1] w-120 h-0.5"></div>

        <button
          onClick={() => navigate("/projects")}
          className="flex items-center my-10"
          style={{
            padding: "12px 24px",
            borderRadius: "30px",
            backgroundColor: "#333",
            border: "1px solid #555",
            color: "#fff",
            textDecoration: "none",
            cursor: "pointer",
            transition: "transform 0.3s, box-shadow 0.3s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "scale(1.05)";
            (e.currentTarget as HTMLElement).style.boxShadow =
              "0 4px 15px rgba(255, 255, 255, 0.2)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "scale(1)";
            (e.currentTarget as HTMLElement).style.boxShadow = "none";
          }}
        >
          {" "}
          See more projects
          <img
            className="w-6 h-6 ml-2"
            src="/icons/open-in-new-window.svg"
          ></img>
        </button>
        <div className="bg-[#A1A1A1] w-120 h-0.5"></div>
      </div>

      {/* Technology Rolling Banner */}
      <TechnologyBanner />
      {/* Contact Section */}
      <section
        id="contact"
        style={{
          padding: "100px 20px",
          backgroundColor: "#0A0A0A",
          color: "#fff",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "2.5rem",
            fontWeight: "bold",
            color: "#fff",
            letterSpacing: "1px",
            textShadow: "0 1px 2px rgba(0, 0, 0, 0.6)",
            marginBottom: "20px",
          }}
        >
          Contact Me
        </h2>
        <p
          style={{
            maxWidth: "600px",
            margin: "20px auto",
            lineHeight: "1.8",
            fontSize: "1.1rem",
            color: "#ccc",
          }}
        >
          Whether you have a project in mind or just want to say hello, feel
          free to reach out. I’m always excited to hear from new people.
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "20px",
            marginBottom: "40px",
          }}
        >
          <a
            href="mailto:your.email@example.com"
            style={{
              padding: "12px 24px",
              borderRadius: "30px",
              backgroundColor: "#333",
              border: "1px solid #555",
              color: "#fff",
              textDecoration: "none",
              cursor: "pointer",
              transition: "transform 0.3s, box-shadow 0.3s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "scale(1.05)";
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 4px 15px rgba(255, 255, 255, 0.2)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "scale(1)";
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            Send Email
          </a>
          <a
            style={{
              padding: "12px 24px",
              borderRadius: "30px",
              backgroundColor: "#333",
              border: "1px solid #555",
              color: "#fff",
              textDecoration: "none",
              cursor: "pointer",
              transition: "transform 0.3s, box-shadow 0.3s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "scale(1.05)";
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 4px 15px rgba(255, 255, 255, 0.2)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "scale(1)";
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
            onClick={() =>
              window.open(
                "https://www.upwork.com/freelancers/~018d545763da52c09d",
                "_blank"
              )
            }
          >
            Start a Project
          </a>
        </div>
        <div className="w-96 h-1 bg-[#1A1A1A] align-center m-auto mb-10 rounded-full"></div>
        <h2
          style={{
            fontSize: "2.5rem",
            fontWeight: "bold",
            color: "#fff",
            letterSpacing: "1px",
            textShadow: "0 1px 2px rgba(0, 0, 0, 0.6)",
            marginBottom: "20px",
          }}
        >
          Socials
        </h2>
        {/* RadialSocialMenu placed relatively within the contact section */}
        <RadialSocialMenu
          radius={70}
          startAngle={-180}
          endAngle={0}
          positionType="relative"
        />
      </section>
    </div>
  );
};

export default Portfolio;
