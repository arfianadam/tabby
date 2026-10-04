import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  applyCollectionEdit,
  createCollection,
  deleteCollection,
} from "../services/collections";
import {
  createWorkspaceEditor,
  idleBusy,
  type Notify,
  type WorkspaceBusy,
  type WorkspaceEditingState,
  type WorkspaceEditor,
} from "../workspaceEditing";

type UseWorkspaceEditingOptions = WorkspaceEditingState & {
  uid: string;
  notify: Notify;
};

export type WorkspaceEditing = WorkspaceEditor &
  WorkspaceBusy & {
    canEdit: boolean;
  };

export const useWorkspaceEditing = ({
  uid,
  notify,
  allowSync,
  editMode,
  collection,
}: UseWorkspaceEditingOptions): WorkspaceEditing => {
  const [busy, setBusy] = useState<WorkspaceBusy>(idleBusy);
  const stateRef = useRef<WorkspaceEditingState>({
    allowSync,
    editMode,
    collection,
  });

  useLayoutEffect(() => {
    stateRef.current = { allowSync, editMode, collection };
  }, [allowSync, editMode, collection]);

  // Reads guard state through the ref so the edit functions stay referentially stable.
  const editor = useMemo(
    () =>
      createWorkspaceEditor({
        persistence: {
          createCollection: (name) => createCollection(uid, name),
          deleteCollection: (collectionId) =>
            deleteCollection(uid, collectionId),
          applyEdit: (collectionId, edit) =>
            applyCollectionEdit(uid, collectionId, edit),
        },
        notify,
        confirm: (message) => window.confirm(message),
        getState: () => stateRef.current,
        onBusyChange: setBusy,
      }),
    [uid, notify],
  );

  const canEdit = allowSync && editMode;

  return useMemo(
    () => ({ ...editor, ...busy, canEdit }),
    [editor, busy, canEdit],
  );
};
