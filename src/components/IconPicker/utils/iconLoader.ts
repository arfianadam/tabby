import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faFolderOpen } from "@fortawesome/free-solid-svg-icons";
import * as solidIcons from "@fortawesome/free-solid-svg-icons";

const iconCache = new Map<string, IconDefinition>();

export const getIconDefinition = (iconName?: string | null): IconDefinition => {
  if (!iconName) {
    return faFolderOpen;
  }

  const cached = iconCache.get(iconName);
  if (cached) {
    return cached;
  }

  const icon = (solidIcons as Record<string, unknown>)[iconName];
  if (icon && typeof icon === "object" && "iconName" in icon) {
    iconCache.set(iconName, icon as IconDefinition);
    return icon as IconDefinition;
  }

  return faFolderOpen;
};

export const isValidIconName = (iconName: string): boolean => {
  if (!iconName) return false;
  const icon = (solidIcons as Record<string, unknown>)[iconName];
  return (
    icon !== undefined &&
    typeof icon === "object" &&
    icon !== null &&
    "iconName" in icon
  );
};

export const DEFAULT_FOLDER_ICON = "faFolderOpen";
