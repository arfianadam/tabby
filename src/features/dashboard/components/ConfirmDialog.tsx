import { useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation, faXmark } from "@/utils/uiIcons";
import { useDialogA11y } from "@/hooks/useDialogA11y";
import { subtleButtonClasses } from "./constants";

export type ConfirmDialogRequest = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
};

type ConfirmDialogProps = {
  request: ConfirmDialogRequest | null;
  onResolve: (confirmed: boolean) => void;
};

const ConfirmDialog = ({ request, onResolve }: ConfirmDialogProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useDialogA11y({
    open: Boolean(request),
    containerRef: dialogRef,
    initialFocusRef: cancelRef,
    onClose: () => onResolve(false),
  });

  if (!request) {
    return null;
  }

  const isDanger = (request.tone ?? "danger") === "danger";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#171a17]/72 backdrop-blur-sm"
        aria-hidden="true"
        onClick={() => onResolve(false)}
      />
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        tabIndex={-1}
        className="relative z-10 w-full max-w-md rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_32px_100px_rgba(0,0,0,0.36)] focus:outline-none"
      >
        <div className="flex items-start gap-4">
          <span
            className={`flex size-11 shrink-0 items-center justify-center rounded-2xl text-base ${
              isDanger
                ? "bg-rose-500/12 text-rose-600 dark:text-rose-400"
                : "bg-[var(--accent)]/12 text-[var(--accent)]"
            }`}
          >
            <FontAwesomeIcon icon={faTriangleExclamation} />
          </span>
          <div className="min-w-0 flex-1">
            <h3
              id="confirm-dialog-title"
              className="text-lg font-bold tracking-tight text-[var(--ink)]"
            >
              {request.title}
            </h3>
            <p
              id="confirm-dialog-description"
              className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]"
            >
              {request.message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onResolve(false)}
            aria-label="Close confirmation dialog"
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
        <div className="mt-6 flex justify-end gap-2.5">
          <button
            ref={cancelRef}
            type="button"
            onClick={() => onResolve(false)}
            className={subtleButtonClasses}
          >
            {request.cancelLabel ?? "Cancel"}
          </button>
          <button
            type="button"
            onClick={() => onResolve(true)}
            className={`inline-flex cursor-pointer items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] ${
              isDanger
                ? "bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-500"
                : "bg-[var(--accent-fill)] hover:bg-[var(--accent-fill-hover)] focus-visible:ring-[var(--accent)]"
            }`}
          >
            {request.confirmLabel ?? "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
