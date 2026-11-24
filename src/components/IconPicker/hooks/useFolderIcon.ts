import { useEffect, useSyncExternalStore } from "react";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  DEFAULT_FOLDER_ICON,
  getIconDefinition,
  isSolidIconsLoaded,
  loadSolidIcons,
  subscribeSolidIconsLoaded,
} from "../utils/iconLoader";

/**
 * Resolves a folder's icon without eagerly loading the full FontAwesome pack
 * when folders only use the default icon.
 */
export const useFolderIcon = (iconName?: string | null): IconDefinition => {
  const needsCustomIcon = Boolean(iconName && iconName !== DEFAULT_FOLDER_ICON);
  const loaded = useSyncExternalStore(
    subscribeSolidIconsLoaded,
    isSolidIconsLoaded,
    () => false,
  );

  useEffect(() => {
    if (needsCustomIcon && !loaded) {
      void loadSolidIcons().catch(() => {
        // Fallback to default icon if lazy pack fails to load.
      });
    }
  }, [needsCustomIcon, loaded]);

  return getIconDefinition(iconName);
};
