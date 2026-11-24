import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  applyCollectionEdit,
  createCollection,
  deleteCollection,
  moveBookmarkAcrossCollections,
  renameCollection,
  reorderCollections,
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
  confirm: (message: string) => Promise<boolean>;
};

export type WorkspaceEditing = WorkspaceEditor &
  WorkspaceBusy & {
    canEdit: boolean;
  };

export const useWorkspaceEditing = ({
  uid,
  notify,
  confirm,
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
          renameCollection: (collectionId, name) =>
            renameCollection(uid, collectionId, name),
          reorderCollections: (orderedIds) =>
            reorderCollections(uid, orderedIds),
          deleteCollection: (collectionId) =>
            deleteCollection(uid, collectionId),
          applyEdit: (collectionId, edit) =>
            applyCollectionEdit(uid, collectionId, edit),
          moveBookmarkAcrossCollections: (
            sourceCollectionId,
            sourceFolderId,
            targetCollectionId,
            targetFolderId,
            bookmarkId,
            updatedData,
          ) =>
            moveBookmarkAcrossCollections(
              uid,
              sourceCollectionId,
              sourceFolderId,
              targetCollectionId,
              targetFolderId,
              bookmarkId,
              updatedData,
            ),
        },
        notify,
        confirm,
        getState: () => stateRef.current,
        onBusyChange: setBusy,
      }),
    [uid, notify, confirm],
  );

  const canEdit = allowSync && editMode;

  return useMemo(
    () => ({ ...editor, ...busy, canEdit }),
    [editor, busy, canEdit],
  );
};
