import React, { useState, useEffect, useRef } from "react";
import "./About.css";

const sections = [
  { id: "landing", label: "Home" },
  { id: "childhood", label: "Childhood" },
  { id: "teenager", label: "Teenager" },
  { id: "young-adult", label: "Young Adult" },
  { id: "adult", label: "Adult" },
];

const About = () => {
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [isButtonFixed, setIsButtonFixed] = useState(false);
  const scrollAnimationRef = useRef();

  // Auto-scroll effect
  useEffect(() => {
    if (isAutoScrolling) {
      const scrollStep = () => {
        window.scrollBy(0, 1);
        scrollAnimationRef.current = requestAnimationFrame(scrollStep);
      };
      scrollAnimationRef.current = requestAnimationFrame(scrollStep);
    } else if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
    }
    return () => {
      if (scrollAnimationRef.current)
        cancelAnimationFrame(scrollAnimationRef.current);
    };
  }, [isAutoScrolling]);

  // Listen to user scroll events to both disable auto-scroll and toggle button position
  useEffect(() => {
    const handleUserScroll = () => {
      if (isAutoScrolling) setIsAutoScrolling(false);
      if (window.scrollY > window.innerHeight / 2) {
        setIsButtonFixed(true);
      } else {
        setIsButtonFixed(false);
      }
    };

    window.addEventListener("wheel", handleUserScroll);
    window.addEventListener("touchmove", handleUserScroll);
    window.addEventListener("scroll", handleUserScroll);
    return () => {
      window.removeEventListener("wheel", handleUserScroll);
      window.removeEventListener("touchmove", handleUserScroll);
      window.removeEventListener("scroll", handleUserScroll);
    };
  }, [isAutoScrolling]);

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) section.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div>
      {/* Vertical Timeline Navigation */}
      <div className="vertical-nav">
        {sections.map((section) => (
          <div
            key={section.id}
            className="nav-dot"
            data-label={section.label}
            onClick={() => scrollToSection(section.id)}
          />
        ))}
      </div>

      {/* Landing Section */}
      <section id="landing" className="section landing">
        <h1>About Me</h1>
        <img src="your-avatar-image-url.jpg" alt="Avatar" className="avatar" />
        <p>
          A brief description about yourself. Include your background,
          technologies you use, and the schools or experiences that shaped you.
        </p>
        {/* The scroll-control container uses either the "initial" or "fixed" class */}
        <div
          className={`scroll-control ${isButtonFixed ? "fixed" : "initial"}`}
        >
          {isAutoScrolling ? (
            <button onClick={() => setIsAutoScrolling(false)}>Pause</button>
          ) : (
            <button onClick={() => setIsAutoScrolling(true)}>Play</button>
          )}
        </div>
      </section>

      {/* Story Sections */}
      <section id="childhood" className="section childhood">
        <h2>Childhood</h2>
        <p>Your childhood story goes here...</p>
      </section>
      <section id="teenager" className="section teenager">
        <h2>Teenager</h2>
        <p>Your teenage years story goes here...</p>
      </section>
      <section id="young-adult" className="section young-adult">
        <h2>Young Adult</h2>
        <p>Your young adult story goes here...</p>
      </section>
      <section id="adult" className="section adult">
        <h2>Adult</h2>
        <p>Your adult story goes here...</p>
      </section>
    </div>
  );
};

export default About;
