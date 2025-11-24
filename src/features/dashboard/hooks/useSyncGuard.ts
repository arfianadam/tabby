import { useCallback } from "react";
import type { Banner } from "../components/types";

type NotifyFn = (
  text: string,
  tone?: Banner["tone"],
  action?: Banner["action"],
) => void;

export const useSyncGuard = (allowSync: boolean, notify: NotifyFn) => {
  return useCallback(() => {
    if (!allowSync) {
      notify("Still restoring your workspace. Please wait…", "info");
      return true;
    }
    return false;
  }, [allowSync, notify]);
};
