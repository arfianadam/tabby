import { useCallback, useEffect, useState } from "react";
import {
  getInitialFolderSettingsFormState,
  type FolderSettingsFormState,
} from "../components/types";
import type { Folder } from "@/types";
import { DEFAULT_FOLDER_ICON } from "@/components/IconPicker";

export const useFolderSettingsModalState = (
  selectedCollectionId: string | null,
) => {
  const [settingsModalFolderId, setSettingsModalFolderId] = useState<
    string | null
  >(null);
  const [folderSettingsForm, setFolderSettingsForm] =
    useState<FolderSettingsFormState>(getInitialFolderSettingsFormState);

  useEffect(() => {
    setSettingsModalFolderId(null);
    setFolderSettingsForm(getInitialFolderSettingsFormState());
  }, [selectedCollectionId]);

  const closeFolderSettingsModal = useCallback(() => {
    setSettingsModalFolderId(null);
    setFolderSettingsForm(getInitialFolderSettingsFormState());
  }, []);

  const openFolderSettingsModal = useCallback((folder: Folder) => {
    setSettingsModalFolderId(folder.id);
    setFolderSettingsForm({
      name: folder.name,
      icon: folder.icon || DEFAULT_FOLDER_ICON,
    });
  }, []);

  const handleFolderSettingsFormChange = useCallback(
    (field: keyof FolderSettingsFormState, value: string) => {
      setFolderSettingsForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  return {
    settingsModalFolderId,
    folderSettingsForm,
    openFolderSettingsModal,
    closeFolderSettingsModal,
    handleFolderSettingsFormChange,
  };
};
