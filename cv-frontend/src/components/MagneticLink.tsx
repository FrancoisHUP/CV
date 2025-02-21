import React, { useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";

const MagneticLink = ({ to, children }) => {
  const linkRef = useRef(null);

  const handleMouseMove = (event) => {
    const link = linkRef.current;
    if (!link) return;

    const { left, top, width, height } = link.getBoundingClientRect();
    const x = event.clientX - (left + width / 2);
    const y = event.clientY - (top + height / 2);

    gsap.to(link, {
      x: x * 0.2, // Small pull effect
      y: y * 0.2,
      scale: 1.2,
      color: "white",
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = () => {
    gsap.to(linkRef.current, {
      x: 0,
      y: 0,
      scale: 1,
      color: "rgba(255, 255, 255, 0.75)",
      duration: 0.5,
      ease: "power2.out",
    });
  };

  return (
    <Link
      to={to}
      ref={linkRef}
      className="font-inconsolata tracking-widest text-xl relative"
      style={{
        textDecoration: "none",
        color: "rgba(255, 255, 255, 0.75)",
        display: "inline-block",
        transition: "transform 0.2s ease-out",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </Link>
  );
};

export default MagneticLink;
