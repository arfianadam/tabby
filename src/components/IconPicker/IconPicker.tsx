import { memo, useCallback, useRef, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faXmark,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { useIconRegistry } from "./hooks/useIconRegistry";
import { useVirtualizedGrid } from "./hooks/useVirtualizedGrid";
import { getIconDefinition } from "./utils/iconLoader";
import type { IconCategory } from "./data/iconRegistry";

type IconPickerProps = {
  selectedIcon: string;
  onSelectIcon: (iconName: string) => void;
  colorClass?: string;
  disabled?: boolean;
};

const ICON_BUTTON_SIZE = 48;
const GRID_GAP = 8;
const CONTAINER_HEIGHT = 280;
const COLUMNS_PER_ROW = 8;

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

  const { visibleIndices, totalHeight, offsetY, onScroll } = useVirtualizedGrid(
    {
      itemCount: icons.length,
      itemHeight: ICON_BUTTON_SIZE + GRID_GAP,
      containerHeight: CONTAINER_HEIGHT,
      columnsPerRow: COLUMNS_PER_ROW,
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
  }, [searchQuery, selectedCategory]);

  return (
    <div className="flex flex-col gap-3">
      {/* Search Bar */}
      <div className="relative group">
        <div
          className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
            isSearchFocused ? "text-[var(--accent)]" : "text-[var(--muted)]"
          }`}
        >
          <FontAwesomeIcon icon={faMagnifyingGlass} className="text-sm" />
        </div>
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          placeholder="Search icons..."
          disabled={disabled}
          className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] py-2.5 pr-9 pl-9 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] transition-all duration-200 focus:border-[var(--accent)] focus:bg-[var(--surface-raised)] focus:outline-none focus:ring-3 focus:ring-orange-500/10 disabled:cursor-not-allowed disabled:opacity-60"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
            aria-label="Clear search"
          >
            <FontAwesomeIcon icon={faXmark} className="text-sm" />
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => handleCategoryChange(category.id)}
            disabled={disabled}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
              selectedCategory === category.id
                ? "bg-[var(--ink)] text-[var(--surface)] shadow-sm"
                : "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]"
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Icon Grid */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="soft-scrollbar relative overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--surface-raised)]"
        style={{ height: CONTAINER_HEIGHT }}
      >
        {icons.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-[var(--muted)]">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="text-3xl mb-2 opacity-40"
            />
            <p className="text-sm">No icons found</p>
            <p className="text-xs opacity-70">Try a different search term</p>
          </div>
        ) : (
          <div
            style={{
              height: totalHeight,
              position: "relative",
            }}
          >
            <div
              className="grid gap-2 p-2"
              style={{
                gridTemplateColumns: `repeat(${COLUMNS_PER_ROW}, minmax(0, 1fr))`,
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

                return (
                  <button
                    key={icon.name}
                    type="button"
                    onClick={() => onSelectIcon(icon.name)}
                    disabled={disabled}
                    title={icon.name
                      .replace("fa", "")
                      .replace(/([A-Z])/g, " $1")
                      .trim()}
                    className={`relative aspect-square flex items-center justify-center rounded-lg transition-all duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 group ${
                      isSelected
                        ? `${colorClass} bg-orange-500/8 ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-[var(--surface-raised)]`
                        : "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]"
                    }`}
                  >
                    <FontAwesomeIcon icon={iconDef} className="text-lg" />
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-[14px] text-white shadow-sm">
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
            {selectedIcon
              .replace("fa", "")
              .replace(/([A-Z])/g, " $1")
              .trim()}
          </span>
        )}
      </div>
    </div>
  );
});

export default IconPicker;
