import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGripVertical } from "@/utils/uiIcons";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { DraggableSyntheticListeners } from "@dnd-kit/core/dist/hooks/useDraggable";
import { editorControlButtonClasses } from "../constants";

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
      title={label}
      ref={setActivatorNodeRef}
      className={`${editorControlButtonClasses} touch-none cursor-grab opacity-65 hover:opacity-100 active:cursor-grabbing ${className}`}
      {...attributes}
      {...listeners}
    >
      <FontAwesomeIcon icon={faGripVertical} />
    </button>
  );
};

export default DragHandle;
