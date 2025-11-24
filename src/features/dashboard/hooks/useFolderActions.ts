import { useCallback, useState } from "react";
import {
  createFolder as requestCreateFolder,
  deleteFolder as requestDeleteFolder,
  renameFolder as requestRenameFolder,
  reorderFolders as requestReorderFolders,
} from "../services/collections";
import type { Collection, Folder } from "@/types";
import type { Banner } from "../components/types";
import { useSyncGuard } from "./useSyncGuard";

type NotifyFn = (
  text: string,
  tone?: Banner["tone"],
  action?: Banner["action"],
) => void;

export const useFolderActions = (
  userId: string,
  allowSync: boolean,
  notify: NotifyFn,
) => {
  const guardSync = useSyncGuard(allowSync, notify);
  const [creatingFolder, setCreatingFolder] = useState(false);

  const createFolder = useCallback(
    async (collection: Collection | null, name: string) => {
      if (!collection || !name.trim() || guardSync()) {
        return false;
      }
      setCreatingFolder(true);
      try {
        await requestCreateFolder(userId, collection.id, name.trim());
        notify("Folder created.", "success");
        return true;
      } catch (err) {
        notify(
          err instanceof Error ? err.message : "Unable to create folder.",
          "danger",
        );
        return false;
      } finally {
        setCreatingFolder(false);
      }
    },
    [guardSync, notify, userId],
  );

  const deleteFolder = useCallback(
    async (collection: Collection | null, folder: Folder) => {
      if (!collection || guardSync()) {
        return false;
      }
      try {
        await requestDeleteFolder(userId, collection.id, folder.id);
        notify("Folder removed.", "info");
        return true;
      } catch (err) {
        notify(
          err instanceof Error ? err.message : "Unable to delete folder.",
          "danger",
        );
        return false;
      }
    },
    [guardSync, notify, userId],
  );

  const renameFolder = useCallback(
    async (collection: Collection | null, folder: Folder, name: string) => {
      if (!collection || guardSync()) {
        return false;
      }
      const trimmed = name.trim();
      if (!trimmed) {
        notify("Provide a folder name before saving.", "danger");
        return false;
      }
      try {
        await requestRenameFolder(userId, collection.id, folder.id, trimmed);
        notify("Folder renamed.", "success");
        return true;
      } catch (err) {
        notify(
          err instanceof Error ? err.message : "Unable to rename folder.",
          "danger",
        );
        return false;
      }
    },
    [guardSync, notify, userId],
  );

  const reorderFolders = useCallback(
    async (collection: Collection | null, orderedFolderIds: string[]) => {
      if (!collection || guardSync()) {
        return;
      }
      try {
        await requestReorderFolders(userId, collection.id, orderedFolderIds);
      } catch (err) {
        notify(
          err instanceof Error ? err.message : "Unable to reorder folders.",
          "danger",
        );
      }
    },
    [guardSync, notify, userId],
  );

  return {
    creatingFolder,
    createFolder,
    deleteFolder,
    renameFolder,
    reorderFolders,
  };
};
