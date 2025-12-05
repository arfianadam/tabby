import { useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faSpinner,
  faFloppyDisk,
} from "@fortawesome/free-solid-svg-icons";
import type { Folder } from "@/types";
import type { FolderSettingsFormState } from "./types";
import { actionButtonClasses, inputClasses } from "./constants";
import { IconPicker, getIconDefinition } from "@/components/IconPicker";
import { getFolderColor } from "@/utils/colors";

type FolderSettingsModalProps = {
  folder: Folder | null;
  open: boolean;
  allowSync: boolean;
  folderForm: FolderSettingsFormState;
  onFolderFormChange: (
    field: keyof FolderSettingsFormState,
    value: string,
  ) => void;
  onSave: (event: React.FormEvent<HTMLFormElement>, folderId: string) => void;
  saving: boolean;
  onClose: () => void;
};

const FolderSettingsModal = ({
  folder,
  open,
  allowSync,
  folderForm,
  onFolderFormChange,
  onSave,
  saving,
  onClose,
}: FolderSettingsModalProps) => {
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && nameInputRef.current) {
      setTimeout(() => {
        nameInputRef.current?.focus();
        nameInputRef.current?.select();
      }, 100);
    }
  }, [open]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open && !saving) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, saving, onClose]);

  if (!open || !folder) {
    return null;
  }

  const previewColors = getFolderColor(folderForm.name || folder.name);
  const previewIcon = getIconDefinition(folderForm.icon);
  const titleId = `folder-settings-${folder.id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm dark:bg-slate-950/80"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-slate-800 overflow-hidden"
      >
        {/* Header with Preview */}
        <div className="relative">
          {/* Gradient Header Background */}
          <div
            className={`py-6 pl-29 pr-6 ${previewColors.headerGradient} transition-colors duration-300`}
          >
            {/* Title */}
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
              Folder Settings
            </p>
            <h3
              id={titleId}
              className="text-lg font-bold text-white truncate max-w-xs"
            >
              {folderForm.name || folder.name}
            </h3>
          </div>

          {/* Close Button */}
          <button
            type="button"
            className="absolute top-4 right-4 cursor-pointer rounded-full h-8 w-8 flex items-center justify-center bg-white/20 text-white/80 transition-all hover:bg-white/30 hover:text-white backdrop-blur-sm"
            onClick={onClose}
            aria-label="Close folder settings"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>

          {/* Preview Icon - Floating */}
          <div className="absolute -bottom-8 left-6">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-white dark:bg-slate-700 ${previewColors.border} border-2 shadow-lg transition-all duration-300`}
            >
              <FontAwesomeIcon
                icon={previewIcon}
                className={`text-2xl ${previewColors.icon} transition-colors duration-300`}
              />
            </div>
          </div>
        </div>

        {/* Form */}
        <form className="p-6 pt-12" onSubmit={(e) => onSave(e, folder.id)}>
          <div className="space-y-6">
            {/* Name Input */}
            <div>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-2">Folder Name</span>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={folderForm.name}
                  onChange={(e) => onFolderFormChange("name", e.target.value)}
                  placeholder="Enter folder name..."
                  className={inputClasses}
                  disabled={!allowSync || saving}
                />
              </label>
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <span className="flex items-center gap-2">Folder Icon</span>
              </label>
              <IconPicker
                selectedIcon={folderForm.icon}
                onSelectIcon={(iconName) =>
                  onFolderFormChange("icon", iconName)
                }
                colorClass={previewColors.icon}
                disabled={!allowSync || saving}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !allowSync}
              className={`${actionButtonClasses} gap-2`}
            >
              <FontAwesomeIcon
                icon={saving ? faSpinner : faFloppyDisk}
                spin={saving}
              />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FolderSettingsModal;
