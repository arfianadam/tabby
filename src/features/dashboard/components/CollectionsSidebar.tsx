import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFolder,
  faFolderOpen,
  faFolderPlus,
  faPlus,
  faSpinner,
  faTrash,
  faChevronLeft,
  faChevronRight,
  faCloudArrowUp,
  faCloudArrowDown,
  faCircleUser,
  faPenToSquare,
  faMoon,
  faSun,
  faArrowRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import type { Collection } from "@/types";
import type { DashboardUser } from "./types";
import {
  actionButtonClasses,
  dangerGhostButtonClasses,
  inputClasses,
  panelClass,
  subtleButtonClasses,
} from "./constants";
import { useDarkMode } from "@/hooks/useDarkMode";

type CollectionsSidebarProps = {
  allowSync: boolean;
  editMode: boolean;
  collections: Collection[];
  selectedCollectionId: string | null;
  creatingCollection: boolean;
  onCreateCollection: (name: string) => void;
  onSelectCollection: (collectionId: string) => void;
  onDeleteCollection: (collection: Collection) => void;
  noCollections: boolean;
  loading: boolean;
  user: DashboardUser;
  onSignOut: () => void;
  onToggleEditMode: () => void;
};

const CollectionsSidebar = ({
  allowSync,
  editMode,
  collections,
  selectedCollectionId,
  creatingCollection,
  onCreateCollection,
  onSelectCollection,
  onDeleteCollection,
  noCollections,
  loading,
  user,
  onSignOut,
  onToggleEditMode,
}: CollectionsSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("tabby-sidebar-collapsed");
    return saved ? JSON.parse(saved) : false;
  });
  const [newCollection, setNewCollection] = useState("");

  useEffect(() => {
    localStorage.setItem(
      "tabby-sidebar-collapsed",
      JSON.stringify(isCollapsed),
    );
  }, [isCollapsed]);
  const { isDark, toggleDarkMode } = useDarkMode();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCreateSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onCreateCollection(newCollection);
    setNewCollection("");
  };

  const sidebarButtonClasses = `${subtleButtonClasses.replace("transition", "")} ${
    mounted ? "transition" : ""
  }`;

  const canEdit = allowSync && editMode;
  const handleCollectionClick = (collectionId: string) =>
    onSelectCollection(collectionId);

  const syncDetails = allowSync
    ? { icon: faCloudArrowUp, text: "Synced", tone: "text-emerald-600" }
    : { icon: faCloudArrowDown, text: "Restoring…", tone: "text-amber-600" };

  // Consistent button sizing when collapsed: fills the container width (constrained by padding) and maintains square aspect ratio
  const collapsedButtonClass =
    "size-12 mx-auto flex items-center justify-center p-0";

  return (
    <aside
      className={`${panelClass} box-content min-h-0 transition-[width] duration-300 ease-in-out flex flex-col overflow-hidden ${
        isCollapsed ? "w-12 items-start" : "w-64"
      }`}
    >
      {/* Header Section */}
      <div
        className={`flex items-center mb-4 ${isCollapsed ? "justify-center" : "justify-between"}`}
      >
        {!isCollapsed && (
          <div className="overflow-hidden whitespace-nowrap">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Tabby
            </h1>
          </div>
        )}
        <button
          className={`rounded-lg cursor-pointer hover:bg-slate-100 text-slate-500 dark:hover:bg-slate-700 dark:text-slate-400 ${
            isCollapsed ? collapsedButtonClass : "size-9"
          }`}
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <FontAwesomeIcon
            icon={isCollapsed ? faChevronRight : faChevronLeft}
          />
        </button>
      </div>

      {/* Create Collection (only visible when expanded) */}
      {canEdit && !isCollapsed && (
        <form className="space-y-2 mb-4" onSubmit={handleCreateSubmit}>
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap overflow-hidden">
            <FontAwesomeIcon icon={faFolderPlus} className="text-slate-400" />
            Create collection
          </span>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="New collection"
              value={newCollection}
              onChange={(event) => setNewCollection(event.target.value)}
              className={inputClasses}
              disabled={!canEdit}
            />
            <button
              type="submit"
              disabled={!canEdit || creatingCollection}
              className={actionButtonClasses}
            >
              <FontAwesomeIcon
                icon={creatingCollection ? faSpinner : faPlus}
                spin={creatingCollection}
              />
            </button>
          </div>
        </form>
      )}

      {/* Collections List */}
      <div className="flex-1 space-y-2 overflow-y-auto overflow-x-hidden scrollbar-thin">
        {noCollections && allowSync && !loading && !isCollapsed && (
          <p className="text-sm text-slate-500 whitespace-nowrap overflow-hidden">
            {canEdit
              ? "Create a collection to start."
              : "Enable edit mode to create."}
          </p>
        )}
        {collections.map((collection) => {
          const isActive = collection.id === selectedCollectionId;
          return (
            <div
              key={collection.id}
              role="button"
              tabIndex={0}
              className={`flex items-center cursor-pointer rounded-xl border text-sm transition hover:border-indigo-300 hover:text-indigo-900 dark:hover:border-indigo-500 dark:hover:text-indigo-100 ${
                isActive
                  ? "border-indigo-300 bg-indigo-50 text-indigo-900 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-100"
                  : "border-transparent bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              } ${isCollapsed ? collapsedButtonClass : "justify-between px-3 py-2"}`}
              onClick={() => handleCollectionClick(collection.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  handleCollectionClick(collection.id);
                }
              }}
              title={isCollapsed ? collection.name : undefined}
            >
              <div
                className={`flex items-center min-w-0 flex-1 ${isCollapsed ? "gap-0 justify-center" : "gap-3"}`}
              >
                <span
                  className={`flex items-center justify-center rounded-lg p-2 text-lg transition-colors ${
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  <FontAwesomeIcon icon={isActive ? faFolderOpen : faFolder} />
                </span>
                {!isCollapsed && (
                  <div className="overflow-hidden flex-1">
                    <p className="font-medium truncate">{collection.name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                      {collection.folders.length} folder
                      {collection.folders.length === 1 ? "" : "s"}
                    </p>
                  </div>
                )}
              </div>
              {canEdit && !isCollapsed && (
                <button
                  className={`h-7 w-7 shrink-0 ml-2 ${dangerGhostButtonClasses}`}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteCollection(collection);
                  }}
                  aria-label={`Delete ${collection.name}`}
                  disabled={!canEdit}
                >
                  <FontAwesomeIcon icon={faTrash} className="text-xs" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Section: User & Controls */}
      <div
        className={`mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-3`}
      >
        {/* User Info */}
        <div
          className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}
        >
          <div
            className={`flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 ${isCollapsed ? collapsedButtonClass : "p-2"}`}
          >
            <FontAwesomeIcon
              icon={faCircleUser}
              className="text-lg text-slate-400 dark:text-slate-500"
            />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">
                {user.email ?? "Signed in"}
              </p>
              <p
                className={`flex items-center gap-1 text-xs ${syncDetails.tone} whitespace-nowrap`}
              >
                <FontAwesomeIcon icon={syncDetails.icon} />
                {syncDetails.text}
              </p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className={`flex ${isCollapsed ? "flex-col gap-2" : "gap-2"}`}>
          {/* Edit Mode Toggle */}
          <button
            className={`${sidebarButtonClasses} ${
              isCollapsed ? collapsedButtonClass : "flex-1 gap-2"
            } ${
              editMode
                ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-300"
                : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            } ${!allowSync ? "cursor-not-allowed opacity-60" : ""}`}
            onClick={onToggleEditMode}
            type="button"
            title="Toggle Edit Mode"
            disabled={!allowSync}
          >
            <FontAwesomeIcon icon={faPenToSquare} />
            {!isCollapsed && (
              <span className="whitespace-nowrap">
                {editMode ? "Done" : "Edit"}
              </span>
            )}
          </button>

          {/* Dark Mode Toggle */}
          <button
            className={`${sidebarButtonClasses} ${isCollapsed ? collapsedButtonClass : "px-3"}`}
            onClick={toggleDarkMode}
            type="button"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            <FontAwesomeIcon icon={isDark ? faMoon : faSun} />
          </button>
        </div>

        {/* Sign Out */}
        <button
          className={`${sidebarButtonClasses} text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 ${isCollapsed ? collapsedButtonClass : "w-full gap-2"}`}
          onClick={onSignOut}
          type="button"
          title="Sign out"
        >
          <FontAwesomeIcon icon={faArrowRightFromBracket} />
          {!isCollapsed && <span className="whitespace-nowrap">Sign out</span>}
        </button>
      </div>
    </aside>
  );
};

export default CollectionsSidebar;
