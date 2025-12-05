import type { ToastTone } from "./constants";

export type BannerTone = ToastTone;

export type BannerAction = {
  label: string;
  onClick: () => void;
};

export type Banner = {
  text: string;
  tone: BannerTone;
  action?: BannerAction;
};

export type BookmarkFormState = {
  title: string;
  url: string;
  note: string;
  faviconUrl: string;
};

export type DashboardUser = {
  uid: string;
  email?: string | null;
};

export const getInitialBookmarkFormState = (): BookmarkFormState => ({
  title: "",
  url: "",
  note: "",
  faviconUrl: "",
});

export type FolderSettingsFormState = {
  name: string;
  icon: string;
};

export const getInitialFolderSettingsFormState =
  (): FolderSettingsFormState => ({
    name: "",
    icon: "faFolderOpen",
  });
