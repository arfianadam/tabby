import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faMagnifyingGlass,
  faSpinner,
  faXmark,
} from "@/utils/uiIcons";
import { useIconRegistry } from "./hooks/useIconRegistry";
import { useVirtualizedGrid } from "./hooks/useVirtualizedGrid";
import {
  getIconDefinition,
  isSolidIconsLoaded,
  loadSolidIcons,
  subscribeSolidIconsLoaded,
} from "./utils/iconLoader";
import type { IconCategory } from "./data/iconRegistry";

type IconPickerProps = {
  selectedIcon: string;
  onSelectIcon: (iconName: string) => void;
  colorClass?: string;
  disabled?: boolean;
};

const ICON_BUTTON_HEIGHT = 48;
const GRID_GAP = 8;
const GRID_PADDING = 8;
const CONTAINER_HEIGHT = 272;

const formatIconLabel = (name: string) =>
  name
    .replace(/^fa/, "")
    .replace(/([A-Z])/g, " $1")
    .trim();

const computeColumns = (width: number) => {
  if (width >= 500) return 8;
  if (width >= 380) return 6;
  return 5;
};

const IconPicker = memo(function IconPicker({
  selectedIcon,
  onSelectIcon,
  colorClass = "text-[var(--accent)]",
  disabled = false,
}: IconPickerProps) {
  const {
    icons,
    categories,
    selectedCategory,
    searchQuery,
    setSelectedCategory,
    setSearchQuery,
  } = useIconRegistry();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [columnsPerRow, setColumnsPerRow] = useState(8);
  const [loadFailed, setLoadFailed] = useState(false);

  const iconsLoaded = useSyncExternalStore(
    subscribeSolidIconsLoaded,
    isSolidIconsLoaded,
    () => false,
  );

  useEffect(() => {
    if (iconsLoaded) {
      return;
    }
    let cancelled = false;
    void loadSolidIcons().catch(() => {
      if (!cancelled) {
        setLoadFailed(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [iconsLoaded]);

  useEffect(() => {
    const node = scrollContainerRef.current;
    if (!node) return;
    const updateColumns = () => {
      setColumnsPerRow(computeColumns(node.clientWidth));
    };
    updateColumns();
    const observer = new ResizeObserver(updateColumns);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const rowHeight = ICON_BUTTON_HEIGHT + GRID_GAP;
  const { visibleIndices, totalHeight, offsetY, onScroll } = useVirtualizedGrid(
    {
      itemCount: icons.length,
      itemHeight: rowHeight,
      containerHeight: CONTAINER_HEIGHT,
      columnsPerRow,
      overscan: 3,
    },
  );

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      onScroll(e.currentTarget.scrollTop);
    },
    [onScroll],
  );

  const handleCategoryChange = useCallback(
    (category: IconCategory) => {
      setSelectedCategory(category);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    },
    [setSelectedCategory],
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    },
    [setSearchQuery],
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    searchInputRef.current?.focus();
  }, [setSearchQuery]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [searchQuery, selectedCategory, columnsPerRow]);

  return (
    <div className="flex flex-col gap-3">
      {/* Search Bar */}
      <div className="relative group">
        <div
          className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
            isSearchFocused ? "text-[var(--accent)]" : "text-[var(--muted)]"
          }`}
        >
          <FontAwesomeIcon icon={faMagnifyingGlass} className="text-sm" />
        </div>
        <input
          ref={searchInputRef}
          id="folder-icon-search"
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          placeholder="Search icons..."
          aria-label="Search icons"
          disabled={disabled}
          className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] py-2.5 pr-9 pl-9 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] transition-all duration-200 focus:border-[var(--accent)] focus:bg-[var(--surface-raised)] focus:outline-none focus:ring-3 focus:ring-[var(--accent)]/15 disabled:cursor-not-allowed disabled:opacity-60"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute top-1/2 right-2.5 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            aria-label="Clear icon search"
          >
            <FontAwesomeIcon icon={faXmark} className="text-sm" />
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div
        role="tablist"
        aria-label="Icon categories"
        className="soft-scrollbar flex gap-1 overflow-x-auto pb-1"
      >
        {categories.map((category) => {
          const active = selectedCategory === category.id;
          return (
            <button
              key={category.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => handleCategoryChange(category.id)}
              disabled={disabled}
              className={`shrink-0 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60 ${
                active
                  ? "bg-[var(--ink)] text-[var(--surface)] shadow-sm"
                  : "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]"
              }`}
            >
              {category.label}
            </button>
          );
        })}
      </div>

      {/* Icon Grid */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="soft-scrollbar relative overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--surface-raised)]"
        style={{ height: CONTAINER_HEIGHT }}
      >
        {!iconsLoaded && !loadFailed ? (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-[var(--muted)]">
            <FontAwesomeIcon icon={faSpinner} spin />
            <span>Loading icons…</span>
          </div>
        ) : loadFailed ? (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-rose-600 dark:text-rose-400">
            Unable to load the icon pack. Please try closing and reopening
            settings.
          </div>
        ) : icons.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-[var(--muted)]">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="mb-2 text-3xl opacity-40"
            />
            <p className="text-sm font-medium text-[var(--ink)]">
              No icons found
            </p>
            <p className="text-xs">Try a different search term</p>
          </div>
        ) : (
          <div
            style={{
              height: totalHeight + GRID_PADDING * 2 - GRID_GAP,
              position: "relative",
            }}
          >
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${columnsPerRow}, minmax(0, 1fr))`,
                gap: `${GRID_GAP}px`,
                padding: `${GRID_PADDING}px`,
                position: "absolute",
                top: offsetY,
                left: 0,
                right: 0,
              }}
            >
              {visibleIndices.map((index) => {
                const icon = icons[index];
                if (!icon) return null;
                const isSelected = selectedIcon === icon.name;
                const iconDef = getIconDefinition(icon.name);
                const label = formatIconLabel(icon.name);

                return (
                  <button
                    key={icon.name}
                    type="button"
                    onClick={() => onSelectIcon(icon.name)}
                    disabled={disabled}
                    title={label}
                    aria-label={label}
                    aria-pressed={isSelected}
                    style={{ height: ICON_BUTTON_HEIGHT }}
                    className={`group relative flex cursor-pointer items-center justify-center rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60 ${
                      isSelected
                        ? `${colorClass} bg-[var(--accent)]/12 ring-2 ring-[var(--accent)]`
                        : "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]"
                    }`}
                  >
                    <FontAwesomeIcon icon={iconDef} className="text-lg" />
                    {isSelected && (
                      <span
                        aria-hidden="true"
                        className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-[var(--accent-fill)] text-[9px] text-white shadow-sm"
                      >
                        <FontAwesomeIcon icon={faCheck} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Icon Count */}
      <div className="flex items-center justify-between text-xs text-[var(--muted)]">
        <span>
          {icons.length} icon{icons.length !== 1 ? "s" : ""}
          {searchQuery && ` matching "${searchQuery}"`}
        </span>
        {selectedIcon && (
          <span className="flex items-center gap-1.5 font-semibold text-[var(--accent)]">
            <FontAwesomeIcon icon={getIconDefinition(selectedIcon)} />
            {formatIconLabel(selectedIcon)}
          </span>
        )}
      </div>
    </div>
  );
});

export default IconPicker;
