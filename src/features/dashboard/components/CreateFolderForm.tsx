import { useState, type RefObject } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faSpinner } from "@/utils/uiIcons";
import { actionButtonClasses, inputClasses } from "./constants";

type CreateFolderFormProps = {
  onCreateFolder: (name: string) => void;
  creatingFolder: boolean;
  disabled: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
};

const CreateFolderForm = ({
  onCreateFolder,
  creatingFolder,
  disabled,
  inputRef,
}: CreateFolderFormProps) => {
  const [newFolder, setNewFolder] = useState("");

  const handleCreateSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newFolder.trim()) {
      return;
    }
    onCreateFolder(newFolder);
    setNewFolder("");
  };

  return (
    <form
      className="flex flex-col gap-2 rounded-2xl border border-[var(--line)] bg-[var(--surface-muted)] p-2 sm:flex-row sm:items-center"
      onSubmit={handleCreateSubmit}
    >
      <label
        htmlFor="new-folder-name"
        className="shrink-0 px-2 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[var(--muted)]"
      >
        Add folder
      </label>
      <div className="flex min-w-0 flex-1 gap-2">
        <input
          ref={inputRef}
          id="new-folder-name"
          type="text"
          placeholder="Name this folder…"
          value={newFolder}
          disabled={disabled}
          onChange={(event) => setNewFolder(event.target.value)}
          className={`${inputClasses} bg-[var(--surface-raised)] py-2 ${
            disabled ? "cursor-not-allowed opacity-60" : ""
          }`}
        />
        <button
          type="submit"
          aria-label="Add folder"
          disabled={creatingFolder || disabled || !newFolder.trim()}
          className={`${actionButtonClasses} shrink-0 gap-2 py-2`}
        >
          <FontAwesomeIcon
            icon={creatingFolder ? faSpinner : faPlus}
            spin={creatingFolder}
          />
          <span className="hidden sm:inline">
            {creatingFolder ? "Adding…" : "Add folder"}
          </span>
        </button>
      </div>
    </form>
  );
};

export default CreateFolderForm;
