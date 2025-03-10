import React, { useMemo } from "react";
import TechnologyIcon from "./TechnologyIcons.tsx";
import { technologyIcons } from "./technologyIcons.ts";

interface TechnologyBannerProps {
  bannerHeight?: number;
}

const TechnologyBanner: React.FC<TechnologyBannerProps> = ({
  bannerHeight = 120,
}) => {
  // Build the techs array from the technologyIcons mapping.
  const techs = useMemo(
    () =>
      Object.entries(technologyIcons).map(([name, logo]) => ({
        name,
        logo,
      })),
    []
  );

  const iconHeight = 30; // approximate vertical space needed per tech (icon + text)
  // Ensure the banner is tall enough so that icons don't overlap.
  const computedBannerHeight = Math.max(
    bannerHeight,
    techs.length * iconHeight
  );

  // Partition the available vertical space into bands, one per tech.
  const positions = useMemo(() => {
    const bandHeight = computedBannerHeight / techs.length;
    return techs.map((_, index) => {
      // Random position within the band's safe area (bandHeight minus iconHeight).
      const min = index * bandHeight;
      const max = (index + 1) * bandHeight - iconHeight;
      const offset = max > min ? Math.random() * (max - min) : 0;
      return min + offset;
    });
  }, [techs, computedBannerHeight, iconHeight]);

  return (
    <div className="p-8 my-20 bg-transparent">
      <div
        style={{
          margin: "0rem 0",
          height: `${computedBannerHeight}px`,
          position: "relative",
          backgroundColor: "#1a1a1a",
          overflow: "hidden",
          borderRadius: "8px",
        }}
      >
        {/* Centered Title */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 10,
            pointerEvents: "none",
            color: "#fff",
            fontSize: "24px",
            fontWeight: "bold",
            backgroundColor: "#0A0A0A",
          }}
          className="p-2 px-4 rounded-xl"
        >
          Technologies
        </div>

        {/* Floating Technology Icons */}
        {techs.map((tech, index) => {
          const duration = 20 + Math.random() * 20; // animation duration between 20 and 40s
          const delay = Math.random() * 5; // random delay for staggering
          const top = positions[index];
          return (
            <div
              key={tech.name}
              style={{
                position: "absolute",
                top: `${top}px`,
                left: "100%",
                animation: `floatLeft ${duration}s linear infinite`,
                animationDelay: `${delay}s`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  // cursor: "pointer",
                  transition: "transform 0.3s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform =
                    "scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                }}
              >
                <TechnologyIcon
                  name={tech.name}
                  style={{ width: "28px", height: "28px", marginRight: "8px" }}
                />
                <span style={{ color: "#fff", fontWeight: "bold" }}>
                  {tech.name}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TechnologyBanner;
