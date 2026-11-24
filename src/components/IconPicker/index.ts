export { default as IconPicker } from "./IconPicker";
export {
  getIconDefinition,
  isValidIconName,
  loadSolidIcons,
  DEFAULT_FOLDER_ICON,
} from "./utils/iconLoader";
export { useFolderIcon } from "./hooks/useFolderIcon";
export type { IconCategory, IconMetadata } from "./data/iconRegistry";
