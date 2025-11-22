import type { DraggableAttributes } from "@dnd-kit/core";
import type { DraggableSyntheticListeners } from "@dnd-kit/core/dist/hooks/useDraggable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGripVertical } from "@fortawesome/free-solid-svg-icons";

type BookmarkDragHandleProps = {
  label: string;
  setActivatorNodeRef?: (element: HTMLElement | null) => void;
  attributes?: DraggableAttributes;
  listeners?: DraggableSyntheticListeners;
  interactive?: boolean;
};

const BookmarkDragHandle = ({
  label,
  setActivatorNodeRef,
  attributes,
  listeners,
  interactive = true,
}: BookmarkDragHandleProps) => {
  const interactionProps = interactive
    ? { ...attributes, ...listeners }
    : {
        tabIndex: -1,
        "aria-hidden": true,
        style: { pointerEvents: "none" as const },
      };

  return (
    <button
      type="button"
      aria-label={label}
      ref={setActivatorNodeRef}
      className="cursor-grab rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 active:cursor-grabbing"
      {...interactionProps}
    >
      <FontAwesomeIcon icon={faGripVertical} />
    </button>
  );
};

export default BookmarkDragHandle;
