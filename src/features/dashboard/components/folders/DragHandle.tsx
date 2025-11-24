import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGripVertical } from "@fortawesome/free-solid-svg-icons";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { DraggableSyntheticListeners } from "@dnd-kit/core/dist/hooks/useDraggable";

type DragHandleProps = {
  label: string;
  attributes?: DraggableAttributes;
  listeners?: DraggableSyntheticListeners;
  setActivatorNodeRef: (element: HTMLElement | null) => void;
  className?: string;
};

const DragHandle = ({
  label,
  attributes,
  listeners,
  setActivatorNodeRef,
  className = "",
}: DragHandleProps) => {
  return (
    <button
      type="button"
      aria-label={label}
      ref={setActivatorNodeRef}
      className={`cursor-grab rounded-md p-1.5 text-slate-400 transition hover:bg-slate-200/50 hover:text-slate-600 active:cursor-grabbing dark:text-slate-500 dark:hover:bg-slate-700/50 dark:hover:text-slate-300 ${className}`}
      {...attributes}
      {...listeners}
    >
      <FontAwesomeIcon icon={faGripVertical} />
    </button>
  );
};

export default DragHandle;
