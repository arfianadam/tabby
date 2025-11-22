import { useEffect, useMemo, useState } from "react";
import type { Collection } from "../../types";

export const useSelectedCollection = (collections: Collection[]) => {
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    string | null
  >(() => localStorage.getItem("tabby-last-collection-id"));

  useEffect(() => {
    if (selectedCollectionId) {
      localStorage.setItem("tabby-last-collection-id", selectedCollectionId);
    }
  }, [selectedCollectionId]);

  useEffect(() => {
    if (!collections.length) {
      return;
    }
    setSelectedCollectionId((prev) => {
      if (prev && collections.some((collection) => collection.id === prev)) {
        return prev;
      }
      return collections[0].id;
    });
  }, [collections]);

  const selectedCollection = useMemo(() => {
    if (!selectedCollectionId) {
      return null;
    }
    return (
      collections.find(
        (collection) => collection.id === selectedCollectionId,
      ) ?? null
    );
  }, [collections, selectedCollectionId]);

  return {
    selectedCollectionId,
    setSelectedCollectionId,
    selectedCollection,
  };
};
