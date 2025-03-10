import { useState } from "react";
import {
  FacebookShareButton,
  TwitterShareButton,
  LinkedinShareButton,
  EmailShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  EmailIcon,
} from "react-share";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  title: string;
  text: string;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  shareUrl,
  title,
  text,
}) => {
  if (!isOpen) return null;

  const [copySuccess, setCopySuccess] = useState(""); // use a string here
  const handleCopy = async () => {
    try {
      // Copy the shareUrl instead of project?.description
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess("Copied!");
      setTimeout(() => setCopySuccess(""), 2000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setCopySuccess("Failed to copy!");
      } else {
        console.error("An unknown error occurred:", err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-60">
      <div className="bg-black rounded p-6 w-80 text-center relative">
        <h3 className="text-lg font-bold mb-4">Share this post</h3>
        <div className="flex justify-around mb-4">
          <FacebookShareButton url={shareUrl} hashtag="#FrankHeroBlog">
            <FacebookIcon size={48} round />
          </FacebookShareButton>
          <TwitterShareButton url={shareUrl} title={title}>
            <TwitterIcon size={48} round />
          </TwitterShareButton>
          <LinkedinShareButton url={shareUrl}>
            <LinkedinIcon size={48} round />
          </LinkedinShareButton>
          <EmailShareButton url={shareUrl} subject={title} body={text}>
            <EmailIcon size={48} round />
          </EmailShareButton>
        </div>
        <button
          onClick={handleCopy}
          className=" flex justify-center mb-2 px-4 py-2 border rounded text-sm hover:bg-gray-100 w-full"
        >
          Copy Link
          <div className="px-3">
            {copySuccess ? (
              <img
                src="/icons/check-green.svg"
                className="h-6 w-6 "
                alt="Copied"
              />
            ) : (
              <img src="/icons/link-light.svg" className="h-6 w-6" alt="Copy" />
            )}
          </div>
        </button>
        <button
          onClick={onClose}
          className="mt-2 px-4 py-2 border rounded text-sm hover:bg-gray-100 w-full"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ShareModal;
