import { useEffect, useMemo, useState } from "react";
import type { Folder } from "../../types";
import { arraysMatch } from "../../utils/arrays";

export const useFolderOrdering = (folders: Folder[]) => {
  const folderIds = useMemo(
    () => folders.map((folder) => folder.id),
    [folders],
  );
  const [folderOrder, setFolderOrder] = useState(folderIds);

  useEffect(() => {
    setFolderOrder((prev) => (arraysMatch(prev, folderIds) ? prev : folderIds));
  }, [folderIds]);

  const folderMap = useMemo(() => {
    const map = new Map<string, Folder>();
    folders.forEach((folder) => map.set(folder.id, folder));
    return map;
  }, [folders]);

  const orderedFolders = folderOrder
    .map((id) => folderMap.get(id))
    .filter((folder): folder is Folder => Boolean(folder));
  const knownFolderIds = new Set(folderOrder);
  const remainingFolders = folders.filter(
    (folder) => !knownFolderIds.has(folder.id),
  );

  return {
    foldersToRender: [...orderedFolders, ...remainingFolders],
    folderOrder,
    setFolderOrder,
  };
};
