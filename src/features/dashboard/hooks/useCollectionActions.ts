import { useCallback, useState } from "react";
import {
  createCollection as requestCreateCollection,
  deleteCollection as requestDeleteCollection,
} from "../services/collections";
import type { Collection } from "@/types";
import type { Banner } from "../components/types";
import { useSyncGuard } from "./useSyncGuard";

type NotifyFn = (
  text: string,
  tone?: Banner["tone"],
  action?: Banner["action"],
) => void;

export const useCollectionActions = (
  userId: string,
  allowSync: boolean,
  notify: NotifyFn,
) => {
  const guardSync = useSyncGuard(allowSync, notify);
  const [creatingCollection, setCreatingCollection] = useState(false);

  const createCollection = useCallback(
    async (name: string) => {
      if (!name.trim() || guardSync()) {
        return null;
      }
      setCreatingCollection(true);
      try {
        const id = await requestCreateCollection(userId, name.trim());
        notify("Collection created.", "success");
        return id;
      } catch (err) {
        notify(
          err instanceof Error ? err.message : "Unable to create collection.",
          "danger",
        );
        return null;
      } finally {
        setCreatingCollection(false);
      }
    },
    [guardSync, notify, userId],
  );

  const deleteCollection = useCallback(
    async (collection: Collection) => {
      if (guardSync()) {
        return false;
      }
      try {
        await requestDeleteCollection(userId, collection.id);
        notify("Collection removed.", "info");
        return true;
      } catch (err) {
        notify(
          err instanceof Error ? err.message : "Unable to delete collection.",
          "danger",
        );
        return false;
      }
    },
    [guardSync, notify, userId],
  );

  return {
    creatingCollection,
    createCollection,
    deleteCollection,
    guardSync,
  };
};
