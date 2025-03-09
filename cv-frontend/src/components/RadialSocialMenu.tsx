import React, { useState } from "react";
import { Share2 } from "lucide-react";

interface SocialLink {
  icon: JSX.Element;
  link: string;
}

interface RadialSocialMenuProps {
  radius?: number; // Distance (in pixels) from the central button
  startAngle?: number; // Starting angle in degrees (0° = right, 90° = top)
  endAngle?: number; // Ending angle in degrees
  positionType?: "fixed" | "relative"; // Controls overall positioning
  containerClassName?: string; // Additional className for container styling
  buttonClassName?: string; // Additional className for the central button
  socialLinks?: SocialLink[]; // Array of social links (optional override)
}

const RadialSocialMenu: React.FC<RadialSocialMenuProps> = ({
  radius = 70,
  startAngle = 0,
  endAngle = 180,
  positionType = "relative",
  containerClassName = "",
  buttonClassName = "",
  socialLinks = [
    {
      icon: (
        <img src="/icons/linkedin.png" alt="LinkedIn" className="w-5 h-5" />
      ),
      link: "https://www.linkedin.com/in/your-profile",
    },
    {
      icon: <img src="/icons/twitter.ico" alt="Twitter" className="w-5 h-5" />,
      link: "https://twitter.com/your-profile",
    },
    {
      icon: (
        <img src="/icons/substack.svg" alt="Substack" className="w-5 h-5" />
      ),
      link: "https://your-substack-url.substack.com",
    },
    {
      icon: <img src="/icons/discord.ico" alt="Discord" className="w-5 h-5" />,
      link: "https://discord.gg/your-invite",
    },
  ],
}) => {
  const [open, setOpen] = useState(false);
  const toggleMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setOpen((prev) => !prev);
  };

  // Calculate angles evenly spread between startAngle and endAngle.
  const angleSpread = endAngle - startAngle;
  const angleIncrement =
    socialLinks.length > 1 ? angleSpread / (socialLinks.length - 1) : 0;

  // Set container positioning based on positionType.
  const containerPositionClass =
    positionType === "fixed"
      ? `fixed bottom-5 right-5 z-50 ${containerClassName}`
      : `relative ${containerClassName}`;

  return (
    <div className={containerPositionClass}>
      <div className="relative w-12 h-12 inline-block">
        {/* Central Button */}
        <button
          onClick={toggleMenu}
          className={`relative z-20 w-12 h-12 rounded-full text-white flex items-center justify-center shadow-lg hover:bg-blue-600 transition ${buttonClassName}`}
        >
          <Share2 size={24} />
        </button>
        {/* Radial Social Media Links */}
        {socialLinks.map((item, index) => {
          const angle = startAngle + index * angleIncrement;
          const angleRad = (angle * Math.PI) / 180;
          const x = radius * Math.cos(angleRad);
          const y = radius * Math.sin(angleRad);
          // Compute a simple delay based on the index.
          const delay = open
            ? index * 50
            : (socialLinks.length - index - 1) * 50;
          return (
            <a
              key={index}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute z-10 w-10 h-10 rounded-full bg-[#0A0A0A] flex items-center justify-center shadow-lg transition-all duration-300 border border-[#1A1A1A] "
              style={{
                top: "50%",
                left: "50%",
                transform: open
                  ? `translate(-50%, -50%) translate(${x}px, ${-y}px)`
                  : "translate(-50%, -50%)",
                opacity: open ? 1 : 0,
                pointerEvents: open ? "auto" : "none",
                transitionDelay: `${delay}ms`,
              }}
            >
              {item.icon}
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default RadialSocialMenu;
