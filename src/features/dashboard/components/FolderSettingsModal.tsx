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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#171a17]/72 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[1.75rem] border border-[var(--line)] bg-[var(--surface)] shadow-[0_32px_100px_rgba(0,0,0,0.34)]"
      >
        {/* Header with Preview */}
        <div className="relative">
          <div className="bg-[#242824] py-7 pr-14 pl-28 text-white">
            {/* Title */}
            <p className="text-[0.64rem] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
              Folder settings
            </p>
            <h3
              id={titleId}
              className="mt-1 max-w-xs truncate text-xl font-bold tracking-tight text-white"
            >
              {folderForm.name || folder.name}
            </h3>
          </div>

          {/* Close Button */}
          <button
            type="button"
            className="absolute top-4 right-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition-all hover:bg-white/10 hover:text-white"
            onClick={onClose}
            aria-label="Close folder settings"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>

          {/* Preview Icon - Floating */}
          <div className="absolute -bottom-8 left-6">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--surface-raised)] ${previewColors.border} border-2 shadow-lg transition-all duration-300`}
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
              <label className="flex flex-col gap-2 text-xs font-bold text-[var(--ink)]">
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
              <label className="mb-2 block text-xs font-bold text-[var(--ink)]">
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
          <div className="mt-8 flex justify-end gap-3 border-t border-[var(--line)] pt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] px-4 py-2.5 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
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
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FolderSettingsModal;
