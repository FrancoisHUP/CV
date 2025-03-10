import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import GitExplorer from "./pages/GitExplorer";
import Projects from "./pages/Projects";
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail"; // Import BlogDetail
import MagneticLink from "./components/MagneticLink";
import ProjectDetail from "./pages/ProjectDetail";
import Working from "./pages/AboutMe";

const App = () => {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Navigation Bar */}
      <nav className="flex items-center justify-center gap-10 p-4">
        <MagneticLink to="/">HOME</MagneticLink>
        <MagneticLink to="/git-expolrer">EXPLORER</MagneticLink>
        <MagneticLink to="/projects">PROJECTS</MagneticLink>
        <MagneticLink to="/blogs">BLOGS</MagneticLink>
        {/* <MagneticLink to="/about">ABOUT ME</MagneticLink> */}
        <MagneticLink to="/working">ABOUT ME</MagneticLink>
      </nav>

      {/* Route Switching */}
      <div style={{ flexGrow: 1, width: "100vw", height: "100%" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/git-expolrer" element={<GitExplorer />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:projectName" element={<ProjectDetail />} />
          {/* <Route path="/about" element={<About />} /> */}
          <Route path="/working" element={<Working />} />
          <Route path="/blogs" element={<Blog />} />
          <Route path="/blog/:postId" element={<BlogDetail />} />{" "}
        </Routes>
      </div>
    </div>
  );
};

export default App;
