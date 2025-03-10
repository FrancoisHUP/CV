import React from "react";
import { technologyIcons } from "./technologyIcons";

interface TechnologyIconProps {
  name: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const TechnologyIcon: React.FC<TechnologyIconProps> = ({
  name,
  alt,
  className,
  style,
}) => {
  const logo = technologyIcons[name];
  if (!logo) return null;
  return (
    <img src={logo} alt={alt || name} className={className} style={style} />
  );
};

export default TechnologyIcon;
