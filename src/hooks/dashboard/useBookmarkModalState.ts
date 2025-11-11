import { useCallback, useEffect, useState } from "react";
import {
  getInitialBookmarkFormState,
  type BookmarkFormState,
} from "../../components/dashboard/types";

export const useBookmarkModalState = (selectedCollectionId: string | null) => {
  const [bookmarkModalFolderId, setBookmarkModalFolderId] = useState<
    string | null
  >(null);
  const [bookmarkForm, setBookmarkForm] = useState<BookmarkFormState>(
    getInitialBookmarkFormState,
  );

  useEffect(() => {
    setBookmarkModalFolderId(null);
    setBookmarkForm(getInitialBookmarkFormState());
  }, [selectedCollectionId]);

  const closeBookmarkModal = useCallback(() => {
    setBookmarkModalFolderId(null);
    setBookmarkForm(getInitialBookmarkFormState());
  }, []);

  const openBookmarkModal = useCallback((folderId: string) => {
    setBookmarkModalFolderId(folderId);
    setBookmarkForm(getInitialBookmarkFormState());
  }, []);

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
    bookmarkForm,
    openBookmarkModal,
    closeBookmarkModal,
    handleBookmarkFormChange,
    resetBookmarkForm,
  };
};
