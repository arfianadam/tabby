import { useCallback, useEffect, useState } from "react";
import {
  getInitialFolderSettingsFormState,
  type FolderSettingsFormState,
} from "../components/types";
import type { Folder } from "@/types";
import { DEFAULT_FOLDER_ICON } from "@/components/IconPicker";
import type { WorkspaceEditing } from "./useWorkspaceEditing";

export const useFolderSettingsModalState = (
  selectedCollectionId: string | null,
  editing: WorkspaceEditing,
) => {
  const { canEdit, ensureCanEdit, updateFolderSettings } = editing;
  const [folderId, setFolderId] = useState<string | null>(null);
  const [form, setForm] = useState<FolderSettingsFormState>(
    getInitialFolderSettingsFormState,
  );

  const close = useCallback(() => {
    setFolderId(null);
    setForm(getInitialFolderSettingsFormState());
  }, []);

  useEffect(() => {
    close();
  }, [selectedCollectionId, close]);

  useEffect(() => {
    if (!canEdit) {
      close();
    }
  }, [canEdit, close]);

  const open = useCallback(
    (folder: Folder) => {
      if (!ensureCanEdit()) {
        return;
      }
      setFolderId(folder.id);
      setForm({
        name: folder.name,
        icon: folder.icon || DEFAULT_FOLDER_ICON,
      });
    },
    [ensureCanEdit],
  );

  const changeField = useCallback(
    (field: keyof FolderSettingsFormState, value: string) => {
      setForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  const save = useCallback(
    (targetFolderId: string) => {
      void (async () => {
        if (await updateFolderSettings(targetFolderId, form.name, form.icon)) {
          close();
        }
      })();
    },
    [form, updateFolderSettings, close],
  );

  return { folderId, form, open, close, changeField, save };
};
