import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getInitialBookmarkFormState,
  type BookmarkFormState,
} from "../components/types";
import type { Bookmark } from "@/types";
import type { BrowserTab } from "@/utils/chrome";
import type { WorkspaceEditing } from "./useWorkspaceEditing";

export type BookmarkModal = {
  folderId: string | null;
  isEditing: boolean;
  form: BookmarkFormState;
  destination: { collectionId: string; folderId: string } | null;
  setDestination: (collectionId: string, folderId: string) => void;
  open: (folderId: string) => void;
  openEdit: (folderId: string, bookmark: Bookmark) => void;
  close: () => void;
  changeField: (field: keyof BookmarkFormState, value: string) => void;
  submit: (folderId: string) => void;
  addTabs: (folderId: string, tabs: BrowserTab[]) => void;
};

export const useBookmarkModalState = (
  selectedCollectionId: string | null,
  editing: WorkspaceEditing,
): BookmarkModal => {
  const { canEdit, ensureCanEdit, saveBookmarks, updateBookmark } = editing;
  const [folderId, setFolderId] = useState<string | null>(null);
  const [editingBookmarkId, setEditingBookmarkId] = useState<string | null>(
    null,
  );
  const [form, setForm] = useState<BookmarkFormState>(
    getInitialBookmarkFormState,
  );
  const [destination, setDestinationState] = useState<{
    collectionId: string;
    folderId: string;
  } | null>(null);

  const close = useCallback(() => {
    setFolderId(null);
    setEditingBookmarkId(null);
    setDestinationState(null);
    setForm(getInitialBookmarkFormState());
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
    (nextFolderId: string) => {
      if (!ensureCanEdit()) {
        return;
      }
      setFolderId(nextFolderId);
      setEditingBookmarkId(null);
      setDestinationState(null);
      setForm(getInitialBookmarkFormState());
    },
    [ensureCanEdit],
  );

  const openEdit = useCallback(
    (nextFolderId: string, bookmark: Bookmark) => {
      if (!ensureCanEdit()) {
        return;
      }
      setFolderId(nextFolderId);
      setEditingBookmarkId(bookmark.id);
      setDestinationState(
        selectedCollectionId
          ? { collectionId: selectedCollectionId, folderId: nextFolderId }
          : null,
      );
      setForm({
        title: bookmark.title,
        url: bookmark.url,
        note: bookmark.note ?? "",
        faviconUrl: bookmark.faviconUrl ?? "",
      });
    },
    [ensureCanEdit, selectedCollectionId],
  );

  const setDestination = useCallback(
    (collectionId: string, nextFolderId: string) => {
      setDestinationState({ collectionId, folderId: nextFolderId });
    },
    [],
  );

  const changeField = useCallback(
    (field: keyof BookmarkFormState, value: string) => {
      setForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  const submit = useCallback(
    (targetFolderId: string) => {
      void (async () => {
        const saved = editingBookmarkId
          ? await updateBookmark(
              targetFolderId,
              editingBookmarkId,
              form,
              destination ?? undefined,
            )
          : await saveBookmarks(targetFolderId, [form]);
        if (saved) {
          close();
        }
      })();
    },
    [
      editingBookmarkId,
      form,
      destination,
      updateBookmark,
      saveBookmarks,
      close,
    ],
  );

  const addTabs = useCallback(
    (targetFolderId: string, tabs: BrowserTab[]) => {
      void (async () => {
        const drafts = tabs.map((tab) => ({ title: tab.title, url: tab.url }));
        if (await saveBookmarks(targetFolderId, drafts)) {
          close();
        }
      })();
    },
    [saveBookmarks, close],
  );

  return useMemo(
    () => ({
      folderId,
      isEditing: Boolean(editingBookmarkId),
      form,
      destination,
      setDestination,
      open,
      openEdit,
      close,
      changeField,
      submit,
      addTabs,
    }),
    [
      folderId,
      editingBookmarkId,
      form,
      destination,
      setDestination,
      open,
      openEdit,
      close,
      changeField,
      submit,
      addTabs,
    ],
  );
};
