export interface Bookmark {
  id: string;
  title: string;
  url: string;
  note?: string;
  createdAt: number;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
  bookmarks: Bookmark[];
}

export interface Collection {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  folders: Folder[];
}

export type BookmarkDraft = Pick<Bookmark, "title" | "url"> & {
  note?: string;
};
