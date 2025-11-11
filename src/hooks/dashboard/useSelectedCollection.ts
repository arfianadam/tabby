import { useEffect, useMemo, useState } from "react";
import type { Collection } from "../../types";

export const useSelectedCollection = (collections: Collection[]) => {
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!collections.length) {
      setSelectedCollectionId(null);
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
