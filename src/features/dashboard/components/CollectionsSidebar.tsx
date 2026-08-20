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
  faCat,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import type { Collection } from "@/types";
import type { DashboardUser } from "./types";
import {
  actionButtonClasses,
  dangerGhostButtonClasses,
  inputClasses,
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
  isCollapsed: boolean;
  onCollapsedChange: (isCollapsed: boolean) => void;
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
  isCollapsed,
  onCollapsedChange,
  onSignOut,
  onToggleEditMode,
}: CollectionsSidebarProps) => {
  const [newCollection, setNewCollection] = useState("");
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

  const sidebarButtonClasses = `inline-flex cursor-pointer items-center justify-center rounded-xl border px-3 py-2 text-sm font-medium hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60 ${mounted ? "transition" : ""}`;

  const canEdit = allowSync && editMode;
  const handleCollectionClick = (collectionId: string) =>
    onSelectCollection(collectionId);

  const syncDetails = allowSync
    ? {
        icon: faCloudArrowUp,
        text: "All changes saved",
        tone: "text-emerald-400",
      }
    : {
        icon: faCloudArrowDown,
        text: "Restoring workspace…",
        tone: "text-amber-400",
      };

  const collapsedButtonClass =
    "mx-auto flex size-11 shrink-0 items-center justify-center p-0";
  const collapseToggleClass = "size-9 flex items-center justify-center p-0";
  const collectionIconClass =
    "flex size-9 shrink-0 items-center justify-center rounded-xl text-base leading-none transition-colors";

  return (
    <aside
      className={`tabby-sidebar flex h-full w-full min-w-0 flex-col overflow-hidden rounded-[1.5rem] bg-[var(--sidebar)] text-white shadow-[0_20px_60px_rgba(25,29,25,0.16)] transition-all duration-300 ease-out ${isCollapsed ? "p-[1.125rem]" : "p-3"}`}
    >
      <div
        className={`sidebar-header mb-4 flex shrink-0 items-center ${isCollapsed ? "h-11 justify-center" : "h-12 justify-between"}`}
      >
        {!isCollapsed && (
          <div className="flex min-w-0 items-center gap-3 overflow-hidden whitespace-nowrap">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-[0.9rem] bg-[var(--accent)] text-lg text-white shadow-[0_8px_24px_rgba(240,100,69,0.28)]">
              <FontAwesomeIcon icon={faCat} />
            </span>
            <div className="sidebar-brand-copy">
              <h1 className="text-[1.05rem] font-bold leading-tight tracking-tight text-white">
                Tabby
              </h1>
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-white/60">
                Link library
              </p>
            </div>
          </div>
        )}
        <button
          className={`sidebar-collapse cursor-pointer rounded-xl border border-white/8 bg-white/5 text-white/45 transition hover:bg-white/10 hover:text-white ${
            isCollapsed ? collapsedButtonClass : collapseToggleClass
          }`}
          onClick={() => onCollapsedChange(!isCollapsed)}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <FontAwesomeIcon
            icon={isCollapsed ? faChevronRight : faChevronLeft}
          />
        </button>
      </div>

      {canEdit && !isCollapsed && (
        <form
          className="sidebar-create mb-4 space-y-2"
          onSubmit={handleCreateSubmit}
        >
          <span className="flex items-center gap-2 overflow-hidden whitespace-nowrap px-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-white/40">
            <FontAwesomeIcon icon={faFolderPlus} />
            New collection
          </span>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="New collection"
              value={newCollection}
              onChange={(event) => setNewCollection(event.target.value)}
              className={`${inputClasses} border-white/10 bg-white/7 text-white placeholder:text-white/30 focus:bg-white/10`}
              disabled={!canEdit}
            />
            <button
              type="submit"
              aria-label="Create collection"
              disabled={!canEdit || creatingCollection}
              className={`${actionButtonClasses} size-10 shrink-0 px-0 py-0`}
            >
              <FontAwesomeIcon
                icon={creatingCollection ? faSpinner : faPlus}
                spin={creatingCollection}
              />
            </button>
          </div>
        </form>
      )}

      {!isCollapsed && (
        <p className="sidebar-section-label mb-2 px-1 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-white/55">
          Collections
        </p>
      )}
      <div className="sidebar-collections soft-scrollbar flex-1 space-y-2 overflow-y-auto overflow-x-hidden">
        {noCollections && allowSync && !loading && !isCollapsed && (
          <p className="rounded-xl border border-dashed border-white/10 p-3 text-xs leading-relaxed text-white/40">
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
              className={`flex cursor-pointer items-center rounded-2xl border text-sm transition-all duration-200 ${
                isActive
                  ? "border-white/80 bg-[#f7f5ed] text-[#20231f] shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
                  : "border-transparent bg-transparent text-white/56 hover:bg-white/7 hover:text-white"
              } ${isCollapsed ? collapsedButtonClass : "min-h-13 justify-between px-2.5 py-2"}`}
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
                  className={`${collectionIconClass} ${
                    isActive
                      ? "bg-[var(--accent)]/12 text-[var(--accent)]"
                      : "bg-white/5 text-white/45"
                  }`}
                >
                  <FontAwesomeIcon
                    icon={isActive ? faFolderOpen : faFolder}
                    className="block"
                  />
                </span>
                {!isCollapsed && (
                  <div className="overflow-hidden flex-1">
                    <p className="truncate font-semibold">{collection.name}</p>
                    <p
                      className={`${isActive ? "text-[#666a62]" : "text-white/55"} whitespace-nowrap text-[0.68rem]`}
                    >
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

      <div
        className={`sidebar-footer mt-4 flex flex-col border-t border-white/8 pt-4 ${isCollapsed ? "gap-4" : "gap-2 pb-2"}`}
      >
        {!isCollapsed && (
          <p className="sidebar-footer-label px-1 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-white/55">
            Account
          </p>
        )}
        <div
          className={`sidebar-user flex items-center gap-2.5 ${isCollapsed ? "justify-center" : "rounded-2xl border border-white/8 bg-white/5 p-2.5"}`}
        >
          <div
            className={`flex items-center justify-center rounded-xl bg-white/7 ${isCollapsed ? collapsedButtonClass : "size-9 shrink-0"}`}
          >
            <FontAwesomeIcon
              icon={faCircleUser}
              className="text-base text-white/45"
            />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="truncate text-xs font-semibold text-white/75">
                {user.email ?? "Signed in"}
              </p>
              <p
                className={`flex items-center gap-1 text-[0.65rem] ${syncDetails.tone} whitespace-nowrap`}
              >
                <FontAwesomeIcon icon={syncDetails.icon} />
                {syncDetails.text}
              </p>
            </div>
          )}
        </div>

        <div
          className={`sidebar-controls flex ${isCollapsed ? "flex-col gap-4" : "gap-2"}`}
        >
          <button
            className={`${sidebarButtonClasses} ${
              isCollapsed ? collapsedButtonClass : "flex-1 gap-2"
            } ${
              editMode
                ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                : "border-white/10 bg-white/5 text-white/65 hover:bg-white/10 hover:text-white"
            } ${!allowSync ? "cursor-not-allowed opacity-60" : ""}`}
            onClick={onToggleEditMode}
            type="button"
            title="Toggle Edit Mode"
            aria-pressed={editMode}
            disabled={!allowSync}
          >
            <FontAwesomeIcon icon={faPenToSquare} />
            {!isCollapsed && (
              <span className="whitespace-nowrap">
                {editMode ? "Done" : "Edit"}
              </span>
            )}
          </button>

          <button
            className={`${sidebarButtonClasses} border-white/10 bg-white/5 text-white/65 hover:bg-white/10 hover:text-white ${isCollapsed ? collapsedButtonClass : "flex-1 gap-2"}`}
            onClick={toggleDarkMode}
            type="button"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={isDark}
          >
            <FontAwesomeIcon icon={isDark ? faMoon : faSun} />
            {!isCollapsed && (
              <span className="whitespace-nowrap">
                {isDark ? "Light" : "Dark"}
              </span>
            )}
          </button>
        </div>

        <button
          className={`sidebar-signout inline-flex cursor-pointer items-center rounded-xl border border-transparent text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
            isCollapsed
              ? `${collapsedButtonClass} justify-center text-white/60 hover:border-white/8 hover:bg-white/5 hover:text-white`
              : "w-full justify-start gap-3 px-3 py-2.5 text-white/60 hover:border-rose-400/15 hover:bg-rose-400/10 hover:text-rose-300"
          }`}
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
