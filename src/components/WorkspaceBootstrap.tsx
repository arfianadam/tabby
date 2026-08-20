import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCat, faSpinner } from "@fortawesome/free-solid-svg-icons";

const WorkspaceBootstrap = () => (
  <div className="flex h-full items-center justify-center bg-[var(--canvas)] p-6">
    <div className="w-full max-w-sm rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-8 text-center shadow-[0_24px_70px_rgba(34,38,33,0.12)]">
      <div className="relative mx-auto flex size-14 items-center justify-center rounded-2xl bg-[var(--accent)] text-xl text-white">
        <FontAwesomeIcon icon={faCat} />
        <span className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border-2 border-[var(--surface)] bg-[var(--surface-raised)] text-[0.62rem] text-[var(--accent)]">
          <FontAwesomeIcon icon={faSpinner} spin />
        </span>
      </div>
      <h1 className="mt-5 text-xl font-bold tracking-tight text-[var(--ink)]">
        Preparing your workspace…
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Bringing your collections and links into place.
      </p>
    </div>
  </div>
);

export default WorkspaceBootstrap;
