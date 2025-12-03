import { useCallback, useEffect, useState } from "react";
import {
  getInitialBookmarkFormState,
  type BookmarkFormState,
} from "../components/types";
import type { Bookmark } from "@/types";

export const useBookmarkModalState = (selectedCollectionId: string | null) => {
  const [bookmarkModalFolderId, setBookmarkModalFolderId] = useState<
    string | null
  >(null);
  const [editingBookmarkId, setEditingBookmarkId] = useState<string | null>(
    null,
  );
  const [bookmarkForm, setBookmarkForm] = useState<BookmarkFormState>(
    getInitialBookmarkFormState,
  );

  useEffect(() => {
    setBookmarkModalFolderId(null);
    setEditingBookmarkId(null);
    setBookmarkForm(getInitialBookmarkFormState());
  }, [selectedCollectionId]);

  const closeBookmarkModal = useCallback(() => {
    setBookmarkModalFolderId(null);
    setEditingBookmarkId(null);
    setBookmarkForm(getInitialBookmarkFormState());
  }, []);

  const openBookmarkModal = useCallback((folderId: string) => {
    setBookmarkModalFolderId(folderId);
    setEditingBookmarkId(null);
    setBookmarkForm(getInitialBookmarkFormState());
  }, []);

  const openEditBookmarkModal = useCallback(
    (folderId: string, bookmark: Bookmark) => {
      setBookmarkModalFolderId(folderId);
      setEditingBookmarkId(bookmark.id);
      setBookmarkForm({
        title: bookmark.title,
        url: bookmark.url,
        note: bookmark.note ?? "",
        faviconUrl: bookmark.faviconUrl ?? "",
      });
    },
    [],
  );

  const handleBookmarkFormChange = useCallback(
    (field: keyof BookmarkFormState, value: string) => {
      setBookmarkForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  const resetBookmarkForm = useCallback(() => {
    setBookmarkForm(getInitialBookmarkFormState());
  }, []);

  return {
    bookmarkModalFolderId,
    editingBookmarkId,
    bookmarkForm,
    openBookmarkModal,
    openEditBookmarkModal,
    closeBookmarkModal,
    handleBookmarkFormChange,
    resetBookmarkForm,
  };
};
