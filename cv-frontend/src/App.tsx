import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Projects from "./pages/Projects";
import About from "./pages/About";
import Blog from "./pages/Blog";
import MagneticLink from "./components/MagneticLink";

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
        {/* <div className="align-center">-</div> */}
        <MagneticLink to="/projects">PROJECTS</MagneticLink>
        {/* <div className="align-center">-</div> */}
        <MagneticLink to="/blog">BLOGS</MagneticLink>
        {/* <div className="align-center">-</div> */}
        <MagneticLink to="/about">ABOUT ME</MagneticLink>
      </nav>

      {/* Route Switching */}
      <div style={{ flexGrow: 1, width: "100vw", height: "100%" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/about" element={<About />} />
          <Route path="/blog" element={<Blog />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
