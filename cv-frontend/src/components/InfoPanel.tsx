import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { NodeType } from "./NeuronScene";
import OpenOnGithub from "./OpenOnGithub";

type InfoPanelProps = {
  activeNode: NodeType;
  graphNodes: NodeType[];
  onClose: () => void;
};

export type NodeDetails = {
  description?: {
    summary?: string;
    problem_solved?: string;
    impact?: string;
    relevance?: string;
    technologies?: string[];
    role?: string;
    challenges?: string[];
  };
  architecture?: {
    overview?: string;
    components?: { name: string; description: string }[];
  };
  technical_details?: {
    design_decisions?: { decision: string; reasoning: string }[];
    performance_optimizations?: { optimization: string; impact: string }[];
    lessons_learned?: string[];
  };
};

const InfoPanel: React.FC<InfoPanelProps> = ({
  activeNode,
  graphNodes,
  onClose,
}) => {
  // Helper: builds the breadcrumb (from root to the node)
  const getBreadcrumb = (node: NodeType, nodes: NodeType[]): NodeType[] => {
    const path: NodeType[] = [];
    let current: NodeType | undefined = node;
    while (current) {
      path.push(current);
      if (current.parentId) {
        current = nodes.find((n) => n.id === current?.parentId);
      } else {
        break;
      }
    }
    return path.reverse();
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // 🔹 Fix: Parse details safely
  const parsedDetails =
    typeof activeNode.details === "string"
      ? JSON.parse(activeNode.details)
      : activeNode.details || {};

  // Extract fields from parsedDetails
  const description = parsedDetails?.description;
  const architecture = parsedDetails?.architecture;
  const technical = parsedDetails?.technical_details;

  return (
    <motion.div
      className="absolute top-5 left-5 max-w-xl max-h-[calc(100vh-100px)] overflow-y-auto text-white p-6 rounded-3xl shadow-2xl border border-gray-500 backdrop-blur-md"
      initial={{ opacity: 0, scale: 0.8, x: -50 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{
        fontSize: "22px",
        background:
          "linear-gradient(135deg, rgba(60, 60, 60, 0.8), rgba(39, 39, 39, 0.8))",
        transition: "none",
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-start mb-4 ">
        <div
          className="font-bold text-3xl tracking-wide break-words"
          style={{ maxWidth: "calc(100% - 50px)" }}
        >
          {getBreadcrumb(activeNode, graphNodes).map((n, index, arr) => (
            <span key={n.id}>
              {n.name}
              {index < arr.length - 1 && " / "}
            </span>
          ))}
        </div>
        {/* Close Button */}
        <button
          className="w-12 h-12 bg-gray-100 flex items-center justify-center opacity-70 shadow-lg rounded-md"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          ✖
        </button>
      </div>
      <h4 className="flex items-center justify-between text-4xl font-extrabold mb-6 leading-none">
        {activeNode.name}
      </h4>

      {/* GitHub Button */}
      {activeNode.link && <OpenOnGithub githubLink={activeNode.link} />}

      {activeNode.details && (
        <>
          {/* Description Section */}
          {description &&
            (description.summary ||
              description.problem_solved ||
              description.impact ||
              description.relevance) && (
              <div className="mt-6">
                <h5 className="text-3xl font-bold mb-2">Description</h5>
                {description.summary && <p>{description.summary}</p>}
                {description.problem_solved && (
                  <p>
                    <span className="font-semibold">Problem Solved:</span>{" "}
                    {description.problem_solved}
                  </p>
                )}
                {description.impact && (
                  <p>
                    <span className="font-semibold">Impact:</span>{" "}
                    {description.impact}
                  </p>
                )}
                {description.relevance && (
                  <p>
                    <span className="font-semibold">Relevance:</span>{" "}
                    {description.relevance}
                  </p>
                )}
              </div>
            )}

          {/* Technologies Used */}
          {description?.technologies && description.technologies.length > 0 && (
            <div className="mt-6">
              <h5 className="text-3xl font-bold mb-2">Technologies Used</h5>
              <ul className="list-disc ml-8">
                {description.technologies.map((tech: string, index: number) => (
                  <li key={index}>{tech}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Role */}
          {description?.role && (
            <p className="mt-6">
              <span className="font-semibold">Role:</span> {description.role}
            </p>
          )}

          {/* Challenges */}
          {description?.challenges && description.challenges.length > 0 && (
            <div className="mt-6">
              <h5 className="text-3xl font-bold mb-2">Challenges</h5>
              <ul className="list-disc ml-8">
                {description.challenges.map(
                  (challenge: string, index: number) => (
                    <li key={index}>{challenge}</li>
                  )
                )}
              </ul>
            </div>
          )}

          {/* Architecture Section */}
          {architecture &&
            (architecture.overview ||
              (architecture.components &&
                architecture.components.length > 0)) && (
              <div className="mt-6">
                <h5 className="text-3xl font-bold mb-2">Architecture</h5>
                {architecture.overview && <p>{architecture.overview}</p>}
                {architecture.components &&
                  architecture.components.length > 0 && (
                    <ul className="list-disc ml-8">
                      {architecture.components.map(
                        (
                          component: { name: string; description: string },
                          index: number
                        ) => (
                          <li key={index}>
                            <span className="font-semibold">
                              {component.name}:
                            </span>{" "}
                            {component.description}
                          </li>
                        )
                      )}
                    </ul>
                  )}
              </div>
            )}

          {/* Technical Details */}
          {technical &&
            ((technical.design_decisions &&
              technical.design_decisions.length > 0) ||
              (technical.performance_optimizations &&
                technical.performance_optimizations.length > 0) ||
              (technical.lessons_learned &&
                technical.lessons_learned.length > 0)) && (
              <div className="mt-6">
                <h5 className="text-3xl font-bold mb-2">Technical Details</h5>
                {technical.design_decisions &&
                  technical.design_decisions.length > 0 && (
                    <div>
                      <h6 className="text-2xl font-bold mb-2">
                        Design Decisions
                      </h6>
                      <ul className="list-disc ml-8">
                        {technical.design_decisions.map(
                          (
                            decision: { decision: string; reasoning: string },
                            index: number
                          ) => (
                            <li key={index}>
                              <span className="font-semibold">
                                {decision.decision}:
                              </span>{" "}
                              {decision.reasoning}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                {technical.performance_optimizations &&
                  technical.performance_optimizations.length > 0 && (
                    <div className="mt-4">
                      <h6 className="text-2xl font-bold mb-2">
                        Performance Optimizations
                      </h6>
                      <ul className="list-disc ml-8">
                        {technical.performance_optimizations.map(
                          (
                            opt: { optimization: string; impact: string },
                            index: number
                          ) => (
                            <li key={index}>
                              <span className="font-semibold">
                                {opt.optimization}:
                              </span>{" "}
                              {opt.impact}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                {technical.lessons_learned &&
                  technical.lessons_learned.length > 0 && (
                    <div className="mt-4">
                      <h6 className="text-2xl font-bold mb-2">
                        Lessons Learned
                      </h6>
                      <ul className="list-disc ml-8">
                        {technical.lessons_learned.map(
                          (lesson: string, index: number) => (
                            <li key={index}>{lesson}</li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
              </div>
            )}
        </>
      )}
    </motion.div>
  );
};

export default InfoPanel;
