// cv-frontend/src/components/TechnologyIcons.tsx
import React from "react";

export const technologyIcons: Record<string, string> = {
  React: "/icons/react.svg",
  "Node.js": "/icons/nodejs.svg",
  Vue: "/icons/vuejs.svg",
  TypeScript: "/icons/typescript.svg",
  "Three.js": "/icons/threejs.ico",
  "React Three Fiber": "/icons/reactthreefiber.png",
  Docker: "/icons/docker.svg",
  Nginx: "/icons/nginx.svg",
  Vite: "/icons/vite.svg",
  TailwindCSS: "/icons/tailwind.svg",
  "Framer Motion": "/icons/framer-motion.svg",
  GSAP: "/icons/gsap.png",
  "Socket.IO Client": "/icons/socket-io.png",
  Python: "/icons/python.png",
  tqdm: "/icons/tqdm.gif",
  numpy: "/icons/numpy.svg",
  pandas: "/icons/pandas.svg",
  matplotlib: "/icons/matplotlib.svg",
  scipy: "/icons/scipy.svg",
  "scikit-learn": "/icons/scipy.png",
  Latex: "/icons/latex.png",
  torch: "/icons/torch.svg",
  tkinter: "/icons/tkinter.ico",
};

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
