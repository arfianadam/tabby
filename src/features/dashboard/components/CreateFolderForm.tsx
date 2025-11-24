import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { actionButtonClasses, inputClasses } from "./constants";

type CreateFolderFormProps = {
  onCreateFolder: (name: string) => void;
  creatingFolder: boolean;
  disabled: boolean;
};

const CreateFolderForm = ({
  onCreateFolder,
  creatingFolder,
  disabled,
}: CreateFolderFormProps) => {
  const [newFolder, setNewFolder] = useState("");

  const handleCreateSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onCreateFolder(newFolder);
    setNewFolder("");
  };

  return (
    <form className="space-y-1" onSubmit={handleCreateSubmit}>
      <label className="flex flex-col gap-1 text-sm font-medium uppercase text-slate-700 dark:text-slate-300">
        New folder
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ex: Launch inspiration"
            value={newFolder}
            disabled={disabled}
            onChange={(event) => setNewFolder(event.target.value)}
            className={`${inputClasses} ${
              disabled ? "cursor-not-allowed opacity-60" : ""
            }`}
          />
          <button
            type="submit"
            disabled={creatingFolder || disabled}
            className={`${actionButtonClasses} gap-2`}
          >
            <FontAwesomeIcon
              icon={creatingFolder ? faSpinner : faPlus}
              spin={creatingFolder}
            />
            {creatingFolder ? "Adding…" : "Add"}
          </button>
        </div>
      </label>
    </form>
  );
};

export default CreateFolderForm;
