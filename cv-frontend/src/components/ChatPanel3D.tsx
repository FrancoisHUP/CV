// // src/components/ChatPanel3D.tsx
// import { Html, Billboard } from "@react-three/drei";
// import * as THREE from "three";

// interface ChatPanel3DProps {
//   message: string;
//   position: THREE.Vector3;
// }

// const ChatPanel3D = ({ message, position }: ChatPanel3DProps) => {
//   return (
//     <Billboard>
//       <Html
//         position={position}
//         // Remove distanceFactor if you want to control size via CSS.
//         style={{
//           pointerEvents: "none",
//           transform: "scale(0.5)",
//         }}
//       >
//         <div className="bg-gray-800 text-white p-2 rounded-lg shadow-lg text-sm w-100">
//           {message}
//         </div>
//       </Html>
//     </Billboard>
//   );
// };

// export default ChatPanel3D;
