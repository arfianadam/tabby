import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

const WorkspaceBootstrap = () => (
  <div className="rounded-2xl bg-white/90 p-6 text-center text-slate-600 shadow-xl ring-1 ring-slate-100 backdrop-blur dark:bg-slate-800/90 dark:text-slate-400 dark:ring-slate-700">
    <div className="flex justify-center text-indigo-500 dark:text-indigo-400">
      <FontAwesomeIcon icon={faSpinner} spin className="text-3xl" />
    </div>
    <h1 className="mt-3 text-xl font-semibold text-slate-900 dark:text-white">
      Preparing your workspace…
    </h1>
    <p className="mt-2 text-sm">Please wait while we sync your account.</p>
  </div>
);

export default WorkspaceBootstrap;
