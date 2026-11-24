import { useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faFloppyDisk, faSpinner, faXmark } from "@/utils/uiIcons";
import type { Folder } from "@/types";
import type { FolderSettingsFormState } from "./types";
import { actionButtonClasses, inputClasses } from "./constants";
import { IconPicker, useFolderIcon } from "@/components/IconPicker";
import { FOLDER_COLOR_OPTIONS, getFolderColor } from "@/utils/colors";
import { useDialogA11y } from "@/hooks/useDialogA11y";

type FolderSettingsModalProps = {
  folder: Folder | null;
  open: boolean;
  allowSync: boolean;
  folderForm: FolderSettingsFormState;
  onFolderFormChange: (
    field: keyof FolderSettingsFormState,
    value: string,
  ) => void;
  onSave: (folderId: string) => void;
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
  const dialogRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const previewIcon = useFolderIcon(folderForm.icon);

  const safeClose = () => {
    if (!saving) {
      onClose();
    }
  };

  useDialogA11y({
    open: Boolean(open && folder),
    containerRef: dialogRef,
    initialFocusRef: nameInputRef,
    locked: saving,
    onClose: safeClose,
  });

  if (!open || !folder) {
    return null;
  }

  const previewColors = getFolderColor(
    folderForm.name || folder.name,
    folderForm.color,
  );
  const titleId = `folder-settings-${folder.id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      <div
        className="absolute inset-0 bg-[#171a17]/72 backdrop-blur-sm"
        aria-hidden="true"
        onClick={safeClose}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="soft-scrollbar relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[1.75rem] border border-[var(--line)] bg-[var(--surface)] shadow-[0_32px_100px_rgba(0,0,0,0.34)] focus:outline-none"
      >
        <div className="flex items-center justify-between gap-4 bg-[#242824] px-6 py-5 text-white">
          <div className="flex min-w-0 items-center gap-4">
            <div
              className={`flex size-13 shrink-0 items-center justify-center rounded-2xl border-2 bg-[var(--surface-raised)] ${previewColors.border} shadow-md transition-colors duration-200`}
            >
              <FontAwesomeIcon
                icon={previewIcon}
                className={`text-xl ${previewColors.icon} transition-colors duration-200`}
              />
            </div>
            <div className="min-w-0">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
                Folder settings
              </p>
              <h3
                id={titleId}
                className="mt-0.5 truncate text-xl font-bold tracking-tight text-white"
              >
                {folderForm.name || folder.name}
              </h3>
            </div>
          </div>

          <button
            type="button"
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/75 transition hover:bg-white/12 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={safeClose}
            disabled={saving}
            aria-label="Close folder settings"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <form
          className="p-6"
          onSubmit={(e) => {
            e.preventDefault();
            onSave(folder.id);
          }}
        >
          <div className="space-y-5">
            <div>
              <label
                htmlFor="folder-settings-name"
                className="flex flex-col gap-2 text-xs font-bold text-[var(--ink)]"
              >
                <span>Folder name</span>
                <input
                  id="folder-settings-name"
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

            <fieldset disabled={!allowSync || saving}>
              <legend className="mb-2 text-xs font-bold text-[var(--ink)]">
                Folder color
              </legend>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onFolderFormChange("color", "")}
                  aria-pressed={!folderForm.color}
                  className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                    !folderForm.color
                      ? "border-[var(--accent)] bg-[var(--accent)]/12 text-[var(--ink)]"
                      : "border-[var(--line)] bg-[var(--surface-muted)] text-[var(--muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  Auto
                </button>
                {FOLDER_COLOR_OPTIONS.map((option) => {
                  const selected = folderForm.color === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => onFolderFormChange("color", option.id)}
                      title={option.label}
                      aria-label={`${option.label} folder color`}
                      aria-pressed={selected}
                      className={`flex size-7 cursor-pointer items-center justify-center rounded-full ${option.swatch} text-white transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] ${
                        selected
                          ? "ring-2 ring-[var(--ink)] ring-offset-2 ring-offset-[var(--surface)]"
                          : ""
                      }`}
                    >
                      {selected && (
                        <FontAwesomeIcon
                          icon={faCheck}
                          className="text-[10px]"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <label
                htmlFor="folder-icon-search"
                className="mb-2 block text-xs font-bold text-[var(--ink)]"
              >
                Folder icon
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

          <div className="mt-6 flex justify-end gap-3 border-t border-[var(--line)] pt-5">
            <button
              type="button"
              onClick={safeClose}
              disabled={saving}
              className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] px-4 py-2.5 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !allowSync || !folderForm.name.trim()}
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
