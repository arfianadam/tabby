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
  colorClass = "text-indigo-600",
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
            isSearchFocused
              ? "text-indigo-500 dark:text-indigo-400"
              : "text-slate-400 dark:text-slate-500"
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
          className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-9 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800 dark:focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
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
                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 shadow-sm"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
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
        className="relative overflow-y-auto rounded-xl border border-slate-200 bg-white dark:bg-slate-800/50 dark:border-slate-700"
        style={{ height: CONTAINER_HEIGHT }}
      >
        {icons.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="text-3xl mb-2 opacity-40"
            />
            <p className="text-sm">No icons found</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Try a different search term
            </p>
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
                        ? `${colorClass} bg-indigo-50 ring-2 ring-indigo-500 ring-offset-1 dark:bg-indigo-900/30 dark:ring-indigo-400 dark:ring-offset-slate-800`
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                    }`}
                  >
                    <FontAwesomeIcon icon={iconDef} className="text-lg" />
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-white text-[14px] shadow-sm">
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
      <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
        <span>
          {icons.length} icon{icons.length !== 1 ? "s" : ""}
          {searchQuery && ` matching "${searchQuery}"`}
        </span>
        {selectedIcon && (
          <span className="flex items-center gap-1.5 font-medium text-indigo-600 dark:text-indigo-400">
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
