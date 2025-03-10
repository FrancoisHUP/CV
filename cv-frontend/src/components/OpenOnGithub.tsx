const OpenOnGithub = ({ githubLink }: { githubLink: string }) => {
  return (
    <a
      href={githubLink}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-stretch bg-[#151b23] hover:bg-gray-700 text-white text-lg font-semibold rounded-lg shadow-md transition duration-300 ease-in-out"
      title="Open on GitHub"
    >
      {/* Left Part: GitHub Logo (Full Height) */}
      <div className="flex items-center justify-center bg-[#0d1117] group-hover:bg-gray-900 px-3 rounded-l-lg transition duration-300 ease-in-out">
        <img
          src="/icons/github-light.svg"
          alt="GitHub Logo"
          className="w-6 h-6"
        />
      </div>

      {/* Right Part: Text */}
      <span className="px-4 py-2">Open on GitHub</span>
    </a>
  );
};

export default OpenOnGithub;
