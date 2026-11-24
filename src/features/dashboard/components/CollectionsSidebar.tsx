import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightFromBracket,
  faCat,
  faChevronLeft,
  faChevronRight,
  faCircleUser,
  faCloudArrowDown,
  faCloudArrowUp,
  faFolder,
  faFolderOpen,
  faFolderPlus,
  faGripVertical,
  faMoon,
  faPenToSquare,
  faPlus,
  faSpinner,
  faSun,
  faTrash,
  faTriangleExclamation,
  faXmark,
} from "@/utils/uiIcons";
import type { Collection } from "@/types";
import type { CollectionSyncSource } from "../collectionSync";
import type { DashboardUser } from "./types";
import { actionButtonClasses, inputClasses } from "./constants";
import { useDarkMode } from "@/hooks/useDarkMode";

type CollectionsSidebarProps = {
  allowSync: boolean;
  syncSource: CollectionSyncSource;
  syncError: Error | null;
  isOnline: boolean;
  isSaving: boolean;
  editMode: boolean;
  collections: Collection[];
  selectedCollectionId: string | null;
  creatingCollection: boolean;
  onCreateCollection: (name: string) => void;
  onSelectCollection: (collectionId: string) => void;
  onDeleteCollection: (collection: Collection) => void;
  onReorderCollections: (orderedIds: string[]) => void;
  noCollections: boolean;
  loading: boolean;
  user: DashboardUser;
  isCollapsed: boolean;
  onCollapsedChange: (isCollapsed: boolean) => void;
  onSignOut: () => void;
  onToggleEditMode: () => void;
};

type SortableCollectionRowProps = {
  collection: Collection;
  isActive: boolean;
  isCollapsed: boolean;
  canEdit: boolean;
  onSelect: (collectionId: string) => void;
  onDelete: (collection: Collection) => void;
};

const collectionIconClass =
  "flex size-9 shrink-0 items-center justify-center rounded-xl text-base leading-none transition-colors";
const collapsedButtonClass =
  "mx-auto flex size-11 shrink-0 items-center justify-center p-0";

const SortableCollectionRow = ({
  collection,
  isActive,
  isCollapsed,
  canEdit,
  onSelect,
  onDelete,
}: SortableCollectionRowProps) => {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: collection.id,
    disabled: !canEdit || isCollapsed,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center rounded-2xl border text-sm transition-colors duration-200 ${
        isActive
          ? "border-[var(--sidebar-active-border)] bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-ink)] shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
          : "border-transparent bg-transparent text-white/75 hover:bg-white/8 hover:text-white"
      } ${isCollapsed ? collapsedButtonClass : "min-h-13 gap-1 px-2 py-1.5"}`}
    >
      {canEdit && !isCollapsed && (
        <button
          ref={setActivatorNodeRef}
          type="button"
          aria-label={`Reorder collection ${collection.name}`}
          title="Drag to reorder"
          className={`flex size-6 shrink-0 touch-none cursor-grab items-center justify-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] active:cursor-grabbing ${
            isActive
              ? "text-[var(--sidebar-active-muted)] hover:bg-black/8 hover:text-[var(--sidebar-active-ink)]"
              : "text-white/45 hover:bg-white/10 hover:text-white"
          }`}
          {...attributes}
          {...listeners}
        >
          <FontAwesomeIcon icon={faGripVertical} className="text-xs" />
        </button>
      )}
      <button
        type="button"
        onClick={() => onSelect(collection.id)}
        aria-current={isActive ? "page" : undefined}
        aria-label={isCollapsed ? collection.name : undefined}
        title={isCollapsed ? collection.name : undefined}
        className={`flex min-w-0 flex-1 cursor-pointer items-center rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
          isCollapsed ? "h-full w-full justify-center" : "gap-2.5 py-0.5"
        }`}
      >
        <span
          className={`${collectionIconClass} ${
            isActive
              ? "bg-[var(--accent)]/15 text-[var(--accent)]"
              : "bg-white/8 text-white/70"
          }`}
        >
          <FontAwesomeIcon
            icon={isActive ? faFolderOpen : faFolder}
            className="block"
          />
        </span>
        {!isCollapsed && (
          <span className="min-w-0 flex-1 overflow-hidden">
            <span className="block truncate font-semibold">
              {collection.name}
            </span>
            <span
              className={`block whitespace-nowrap text-xs ${
                isActive
                  ? "text-[var(--sidebar-active-muted)]"
                  : "text-white/60"
              }`}
            >
              {collection.folders.length}{" "}
              {collection.folders.length === 1 ? "folder" : "folders"}
            </span>
          </span>
        )}
      </button>
      {canEdit && !isCollapsed && (
        <button
          className={`flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
            isActive
              ? "text-[var(--sidebar-active-muted)] hover:bg-rose-500/12 hover:text-rose-600 dark:hover:text-rose-400"
              : "text-white/55 hover:bg-rose-500/20 hover:text-rose-300"
          }`}
          type="button"
          onClick={() => onDelete(collection)}
          aria-label={`Delete collection ${collection.name}`}
          title="Delete collection"
          disabled={!canEdit}
        >
          <FontAwesomeIcon icon={faTrash} className="text-xs" />
        </button>
      )}
    </div>
  );
};

const useCompactViewport = () => {
  const [compact, setCompact] = useState(() =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(max-width: 820px)").matches
      : false,
  );

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(max-width: 820px)");
    const onChange = (event: MediaQueryListEvent) => setCompact(event.matches);
    setCompact(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return compact;
};

const CollectionsSidebar = ({
  allowSync,
  syncSource,
  syncError,
  isOnline,
  isSaving,
  editMode,
  collections,
  selectedCollectionId,
  creatingCollection,
  onCreateCollection,
  onSelectCollection,
  onDeleteCollection,
  onReorderCollections,
  noCollections,
  loading,
  user,
  isCollapsed,
  onCollapsedChange,
  onSignOut,
  onToggleEditMode,
}: CollectionsSidebarProps) => {
  const [newCollection, setNewCollection] = useState("");
  const [compactCreateOpen, setCompactCreateOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const compactInputRef = useRef<HTMLInputElement>(null);
  const { isDark, toggleDarkMode } = useDarkMode();
  const isCompact = useCompactViewport();
  const [mounted, setMounted] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!accountMenuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setAccountMenuOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [accountMenuOpen]);

  useEffect(() => {
    if (compactCreateOpen) {
      compactInputRef.current?.focus();
    }
  }, [compactCreateOpen]);

  const handleCreateSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newCollection.trim()) {
      return;
    }
    onCreateCollection(newCollection);
    setNewCollection("");
    setCompactCreateOpen(false);
  };

  const handleCollectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const ids = collections.map((c) => c.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }
    onReorderCollections(arrayMove(ids, oldIndex, newIndex));
  };

  const sidebarButtonClasses = `inline-flex cursor-pointer items-center justify-center rounded-xl border px-3 py-2 text-sm font-medium hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60 disabled:translate-y-0 ${mounted ? "transition" : ""}`;

  const canEdit = allowSync && editMode;

  const syncDetails = (() => {
    if (isSaving) {
      return {
        icon: faSpinner,
        spin: true,
        text: "Saving changes…",
        tone: "text-sky-300",
      };
    }
    if (!allowSync) {
      return {
        icon: faCloudArrowDown,
        spin: false,
        text: "Restoring workspace…",
        tone: "text-amber-300",
      };
    }
    if (syncError) {
      return {
        icon: faTriangleExclamation,
        spin: false,
        text: "Sync error · Cached",
        tone: "text-rose-300",
      };
    }
    if (!isOnline || syncSource === "cache") {
      return {
        icon: faCloudArrowDown,
        spin: false,
        text: isOnline ? "Reconnecting…" : "Offline · Cached",
        tone: "text-amber-300",
      };
    }
    return {
      icon: faCloudArrowUp,
      spin: false,
      text: "All changes saved",
      tone: "text-emerald-400",
    };
  })();

  const themeIcon = isDark ? faSun : faMoon;
  const themeLabel = isDark ? "Light" : "Dark";
  const themeAriaLabel = isDark
    ? "Switch to light mode"
    : "Switch to dark mode";

  if (isCompact) {
    return (
      <aside className="relative z-30 flex w-full min-w-0 flex-col gap-2 rounded-[1.25rem] bg-[var(--sidebar)] p-2.5 text-white shadow-[0_14px_40px_rgba(25,29,25,0.2)]">
        <div className="flex items-center gap-2">
          <div className="flex shrink-0 items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--accent-fill)] text-base text-white">
              <FontAwesomeIcon icon={faCat} />
            </span>
            <h1 className="sr-only">Tabby</h1>
          </div>

          <nav
            aria-label="Collections"
            className="soft-scrollbar flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto py-0.5"
          >
            {collections.map((collection) => {
              const isActive = collection.id === selectedCollectionId;
              return (
                <div
                  key={collection.id}
                  className={`flex shrink-0 items-center rounded-xl border transition ${
                    isActive
                      ? "border-[var(--sidebar-active-border)] bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-ink)]"
                      : "border-white/10 bg-white/6 text-white/80 hover:bg-white/12 hover:text-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectCollection(collection.id)}
                    aria-current={isActive ? "page" : undefined}
                    className="flex max-w-36 cursor-pointer items-center gap-2 px-2.5 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-xl"
                  >
                    <FontAwesomeIcon
                      icon={isActive ? faFolderOpen : faFolder}
                      className={
                        isActive ? "text-[var(--accent)]" : "text-white/65"
                      }
                    />
                    <span className="truncate">{collection.name}</span>
                  </button>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => onDeleteCollection(collection)}
                      aria-label={`Delete collection ${collection.name}`}
                      title="Delete collection"
                      className={`mr-1 flex size-6 cursor-pointer items-center justify-center rounded-lg text-[11px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
                        isActive
                          ? "text-[var(--sidebar-active-muted)] hover:bg-rose-500/15 hover:text-rose-600"
                          : "text-white/60 hover:bg-rose-500/25 hover:text-rose-200"
                      }`}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  )}
                </div>
              );
            })}
            {allowSync && (
              <button
                type="button"
                onClick={() => {
                  if (!editMode) {
                    onToggleEditMode();
                  }
                  setCompactCreateOpen((prev) => !prev);
                }}
                aria-label="New collection"
                aria-expanded={compactCreateOpen}
                title="New collection"
                className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/25 bg-white/5 text-xs text-white/80 transition hover:border-white/45 hover:bg-white/12 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                <FontAwesomeIcon icon={compactCreateOpen ? faXmark : faPlus} />
              </button>
            )}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={toggleDarkMode}
              title={themeAriaLabel}
              aria-label={themeAriaLabel}
              aria-pressed={isDark}
              className="flex size-9 cursor-pointer items-center justify-center rounded-xl border border-white/12 bg-white/6 text-white/80 transition hover:bg-white/12 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              <FontAwesomeIcon icon={themeIcon} />
            </button>

            <div className="relative" ref={accountMenuRef}>
              <button
                type="button"
                onClick={() => setAccountMenuOpen((prev) => !prev)}
                aria-label="Account and sync status"
                aria-expanded={accountMenuOpen}
                aria-haspopup="menu"
                title="Account"
                className="flex size-9 cursor-pointer items-center justify-center rounded-xl border border-white/12 bg-white/6 text-white/80 transition hover:bg-white/12 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                <FontAwesomeIcon icon={faCircleUser} />
              </button>
              {accountMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-60 rounded-2xl border border-white/12 bg-[#1c201c] p-3 text-white shadow-2xl"
                >
                  <p className="truncate text-xs font-semibold text-white">
                    {user.email ?? "Signed in"}
                  </p>
                  <p
                    className={`mt-1 flex items-center gap-1.5 text-xs ${syncDetails.tone}`}
                  >
                    <FontAwesomeIcon
                      icon={syncDetails.icon}
                      spin={syncDetails.spin}
                    />
                    {syncDetails.text}
                  </p>
                  <div className="mt-3 border-t border-white/10 pt-2">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        onSignOut();
                      }}
                      className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs font-semibold text-rose-300 transition hover:bg-rose-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                    >
                      <FontAwesomeIcon icon={faArrowRightFromBracket} />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {compactCreateOpen && allowSync && (
          <form
            className="flex items-center gap-2 border-t border-white/10 pt-2"
            onSubmit={handleCreateSubmit}
          >
            <input
              ref={compactInputRef}
              type="text"
              placeholder="New collection name…"
              aria-label="New collection name"
              value={newCollection}
              onChange={(event) => setNewCollection(event.target.value)}
              className={`${inputClasses} border-white/15 bg-white/8 py-2 text-white placeholder:text-white/50 focus:bg-white/12`}
            />
            <button
              type="submit"
              disabled={creatingCollection || !newCollection.trim()}
              className={`${actionButtonClasses} shrink-0 gap-1.5 py-2 text-xs`}
            >
              <FontAwesomeIcon
                icon={creatingCollection ? faSpinner : faPlus}
                spin={creatingCollection}
              />
              Create
            </button>
          </form>
        )}
      </aside>
    );
  }

  const collapseToggleClass = "size-9 flex items-center justify-center p-0";

  return (
    <aside
      className={`tabby-sidebar flex h-full w-full min-w-0 flex-col overflow-hidden rounded-[1.5rem] bg-[var(--sidebar)] text-white shadow-[0_20px_60px_rgba(25,29,25,0.16)] transition-all duration-300 ease-out ${isCollapsed ? "p-[1.125rem]" : "p-3"}`}
    >
      <div
        className={`sidebar-header mb-4 flex shrink-0 items-center ${isCollapsed ? "h-11 justify-center" : "h-12 justify-between"}`}
      >
        {isCollapsed ? (
          <h1 className="sr-only">Tabby</h1>
        ) : (
          <div className="flex min-w-0 items-center gap-3 overflow-hidden whitespace-nowrap">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-[0.9rem] bg-[var(--accent-fill)] text-lg text-white shadow-[0_8px_24px_rgba(207,67,38,0.3)]">
              <FontAwesomeIcon icon={faCat} />
            </span>
            <div className="sidebar-brand-copy">
              <h1 className="text-[1.05rem] font-bold leading-tight tracking-tight text-white">
                Tabby
              </h1>
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-white/65">
                Link library
              </p>
            </div>
          </div>
        )}
        <button
          type="button"
          className={`sidebar-collapse cursor-pointer rounded-xl border border-white/12 bg-white/6 text-white/70 transition hover:bg-white/12 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
            isCollapsed ? collapsedButtonClass : collapseToggleClass
          }`}
          onClick={() => onCollapsedChange(!isCollapsed)}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!isCollapsed}
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
          <label
            htmlFor="new-collection-name"
            className="flex items-center gap-2 overflow-hidden whitespace-nowrap px-1 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-white/65"
          >
            <FontAwesomeIcon icon={faFolderPlus} />
            New collection
          </label>
          <div className="flex gap-2">
            <input
              id="new-collection-name"
              type="text"
              placeholder="Collection name…"
              value={newCollection}
              onChange={(event) => setNewCollection(event.target.value)}
              className={`${inputClasses} border-white/15 bg-white/8 text-white placeholder:text-white/45 focus:bg-white/12`}
              disabled={!canEdit}
            />
            <button
              type="submit"
              aria-label="Create collection"
              disabled={!canEdit || creatingCollection || !newCollection.trim()}
              className={`${actionButtonClasses} size-10 shrink-0 px-0! py-0!`}
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
        <p className="sidebar-section-label mb-2 px-1 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-white/65">
          Collections
        </p>
      )}

      <nav
        aria-label="Collections"
        className="sidebar-collections soft-scrollbar flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden"
      >
        {noCollections && allowSync && !loading && !isCollapsed && (
          <div className="rounded-xl border border-dashed border-white/15 p-3 text-xs leading-relaxed text-white/65">
            {canEdit ? (
              <p>Type a name above to create your first collection.</p>
            ) : (
              <button
                type="button"
                onClick={onToggleEditMode}
                className="cursor-pointer font-semibold text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                Enable edit mode to create a collection →
              </button>
            )}
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleCollectionDragEnd}
        >
          <SortableContext
            items={collections.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {collections.map((collection) => (
              <SortableCollectionRow
                key={collection.id}
                collection={collection}
                isActive={collection.id === selectedCollectionId}
                isCollapsed={isCollapsed}
                canEdit={canEdit}
                onSelect={onSelectCollection}
                onDelete={onDeleteCollection}
              />
            ))}
          </SortableContext>
        </DndContext>
      </nav>

      <div
        className={`sidebar-footer mt-4 flex flex-col border-t border-white/10 pt-4 ${isCollapsed ? "gap-3" : "gap-2 pb-1"}`}
      >
        {!isCollapsed && (
          <p className="sidebar-footer-label px-1 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-white/65">
            Account
          </p>
        )}
        <div
          className={`sidebar-user flex items-center gap-2.5 ${isCollapsed ? "justify-center" : "rounded-2xl border border-white/10 bg-white/5 p-2.5"}`}
          title={
            isCollapsed
              ? `${user.email ?? "Signed in"} — ${syncDetails.text}`
              : undefined
          }
        >
          <div
            className={`flex items-center justify-center rounded-xl bg-white/8 ${isCollapsed ? collapsedButtonClass : "size-9 shrink-0"}`}
          >
            <FontAwesomeIcon
              icon={faCircleUser}
              className="text-base text-white/70"
            />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 overflow-hidden">
              <p className="truncate text-xs font-semibold text-white/85">
                {user.email ?? "Signed in"}
              </p>
              <p
                className={`flex items-center gap-1.5 text-[0.6875rem] ${syncDetails.tone} whitespace-nowrap`}
              >
                <FontAwesomeIcon
                  icon={syncDetails.icon}
                  spin={syncDetails.spin}
                />
                {syncDetails.text}
              </p>
            </div>
          )}
        </div>

        <div
          className={`sidebar-controls flex ${isCollapsed ? "flex-col gap-3" : "gap-2"}`}
        >
          <button
            className={`${sidebarButtonClasses} ${
              isCollapsed ? collapsedButtonClass : "flex-1 gap-2"
            } ${
              editMode
                ? "border-[var(--accent-fill)] bg-[var(--accent-fill)] text-white hover:bg-[var(--accent-fill-hover)]"
                : "border-white/12 bg-white/6 text-white/80 hover:bg-white/12 hover:text-white"
            }`}
            onClick={onToggleEditMode}
            type="button"
            title={editMode ? "Exit edit mode" : "Enable edit mode"}
            aria-label={editMode ? "Exit edit mode" : "Enable edit mode"}
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
            className={`${sidebarButtonClasses} border-white/12 bg-white/6 text-white/80 hover:bg-white/12 hover:text-white ${isCollapsed ? collapsedButtonClass : "flex-1 gap-2"}`}
            onClick={toggleDarkMode}
            type="button"
            title={themeAriaLabel}
            aria-label={themeAriaLabel}
            aria-pressed={isDark}
          >
            <FontAwesomeIcon icon={themeIcon} />
            {!isCollapsed && (
              <span className="whitespace-nowrap">{themeLabel}</span>
            )}
          </button>
        </div>

        <button
          className={`sidebar-signout inline-flex cursor-pointer items-center rounded-xl border border-transparent text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:cursor-not-allowed disabled:opacity-60 ${
            isCollapsed
              ? `${collapsedButtonClass} justify-center text-white/70 hover:border-white/10 hover:bg-white/8 hover:text-white`
              : "w-full justify-start gap-3 px-3 py-2.5 text-white/70 hover:border-rose-400/20 hover:bg-rose-400/12 hover:text-rose-300"
          }`}
          onClick={onSignOut}
          type="button"
          title="Sign out"
          aria-label="Sign out"
        >
          <FontAwesomeIcon icon={faArrowRightFromBracket} />
          {!isCollapsed && <span className="whitespace-nowrap">Sign out</span>}
        </button>
      </div>
    </aside>
  );
};

export default CollectionsSidebar;
