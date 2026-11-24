import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faFolderOpen } from "@fortawesome/free-solid-svg-icons/faFolderOpen";

export const DEFAULT_FOLDER_ICON = "faFolderOpen";

type SolidIconsModule = Record<string, unknown>;

let solidIconsModule: SolidIconsModule | null = null;
let loadPromise: Promise<SolidIconsModule> | null = null;
const iconCache = new Map<string, IconDefinition>([
  [DEFAULT_FOLDER_ICON, faFolderOpen],
]);
const listeners = new Set<() => void>();

export const isSolidIconsLoaded = () => solidIconsModule !== null;

export const subscribeSolidIconsLoaded = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const loadSolidIcons = (): Promise<SolidIconsModule> => {
  if (solidIconsModule) {
    return Promise.resolve(solidIconsModule);
  }
  if (!loadPromise) {
    loadPromise = import("@fortawesome/free-solid-svg-icons")
      .then((mod) => {
        solidIconsModule = mod as unknown as SolidIconsModule;
        listeners.forEach((listener) => listener());
        return solidIconsModule;
      })
      .catch((error) => {
        loadPromise = null;
        throw error;
      });
  }
  return loadPromise;
};

export const getIconDefinition = (iconName?: string | null): IconDefinition => {
  if (!iconName || iconName === DEFAULT_FOLDER_ICON) {
    return faFolderOpen;
  }

  const cached = iconCache.get(iconName);
  if (cached) {
    return cached;
  }

  if (solidIconsModule) {
    const icon = solidIconsModule[iconName];
    if (icon && typeof icon === "object" && "iconName" in icon) {
      iconCache.set(iconName, icon as IconDefinition);
      return icon as IconDefinition;
    }
  }

  return faFolderOpen;
};

export const isValidIconName = (iconName: string): boolean => {
  if (!iconName) return false;
  if (iconName === DEFAULT_FOLDER_ICON) return true;
  if (!solidIconsModule) return false;
  const icon = solidIconsModule[iconName];
  return (
    icon !== undefined &&
    typeof icon === "object" &&
    icon !== null &&
    "iconName" in icon
  );
};
