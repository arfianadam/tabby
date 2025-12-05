import { useMemo, useState, useCallback } from "react";
import {
  type IconCategory,
  type IconMetadata,
  searchIcons,
  ICON_CATEGORIES,
} from "../data/iconRegistry";

type UseIconRegistryResult = {
  icons: IconMetadata[];
  categories: typeof ICON_CATEGORIES;
  selectedCategory: IconCategory;
  searchQuery: string;
  setSelectedCategory: (category: IconCategory) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;
};

export const useIconRegistry = (): UseIconRegistryResult => {
  const [selectedCategory, setSelectedCategory] = useState<IconCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const icons = useMemo(() => {
    return searchIcons(searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory]);

  const clearFilters = useCallback(() => {
    setSelectedCategory("all");
    setSearchQuery("");
  }, []);

  return {
    icons,
    categories: ICON_CATEGORIES,
    selectedCategory,
    searchQuery,
    setSelectedCategory,
    setSearchQuery,
    clearFilters,
  };
};
