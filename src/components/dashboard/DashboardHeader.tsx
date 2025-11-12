import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightFromBracket,
  faCircleUser,
  faCloudArrowDown,
  faCloudArrowUp,
  faPenToSquare,
} from "@fortawesome/free-solid-svg-icons";
import type { DashboardUser } from "./types";
import { panelClass, subtleButtonClasses } from "./constants";

type DashboardHeaderProps = {
  user: DashboardUser;
  allowSync: boolean;
  onSignOut: () => void;
  editMode: boolean;
  onToggleEditMode: () => void;
};

const DashboardHeader = ({
  allowSync,
  user,
  onSignOut,
  editMode,
  onToggleEditMode,
}: DashboardHeaderProps) => {
  const syncDetails = allowSync
    ? { icon: faCloudArrowUp, text: "Synced", tone: "text-emerald-600" }
    : { icon: faCloudArrowDown, text: "Restoring…", tone: "text-amber-600" };

  return (
    <header
      className={`${panelClass} lg:flex-row lg:items-center lg:justify-between lg:gap-6`}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
          Synced workspace
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">Tabby</h1>
        <p className="text-sm text-slate-600">
          Toby-style collections kept in sync with Firebase.
        </p>
      </div>
      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon
            icon={faCircleUser}
            className="text-lg text-slate-400"
          />
          <div>
            <p className="text-sm font-medium text-slate-900">
              {user.email ?? "Signed in"}
            </p>
            <p
              className={`flex items-center gap-1 text-xs ${syncDetails.tone}`}
            >
              <FontAwesomeIcon icon={syncDetails.icon} />
              {syncDetails.text}
            </p>
          </div>
        </div>
        <button
          className={`${subtleButtonClasses} gap-2 ${
            editMode
              ? "border-indigo-200 bg-indigo-50 text-indigo-700"
              : "border-slate-200 bg-white text-slate-600"
          } ${!allowSync ? "cursor-not-allowed opacity-60" : ""}`}
          onClick={onToggleEditMode}
          type="button"
          role="switch"
          aria-checked={editMode}
          disabled={!allowSync}
        >
          <span
            className={`relative h-5 w-10 rounded-full transition-all ${
              editMode ? "bg-indigo-600" : "bg-slate-200"
            }`}
            aria-hidden
          >
            <span
              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                editMode ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </span>
          <span className="flex items-center gap-2">
            <FontAwesomeIcon icon={faPenToSquare} />
            {editMode ? "Editing" : "Edit mode"}
          </span>
        </button>
        <button
          className={subtleButtonClasses}
          onClick={onSignOut}
          type="button"
        >
          <FontAwesomeIcon icon={faArrowRightFromBracket} className="mr-2" />
          Sign out
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;
