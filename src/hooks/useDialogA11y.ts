import { useEffect, type RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

type UseDialogA11yOptions = {
  open: boolean;
  containerRef: RefObject<HTMLElement | null>;
  initialFocusRef?: RefObject<HTMLElement | null>;
  locked?: boolean;
  onClose: () => void;
};

export const useDialogA11y = ({
  open,
  containerRef,
  initialFocusRef,
  locked = false,
  onClose,
}: UseDialogA11yOptions) => {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const focusTimer = window.requestAnimationFrame(() => {
      const target = initialFocusRef?.current;
      if (target) {
        target.focus();
        if (target instanceof HTMLInputElement && target.type === "text") {
          target.select();
        }
        return;
      }
      const container = containerRef.current;
      const first = container?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (first ?? container)?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (!locked) {
          event.preventDefault();
          onClose();
        }
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const container = containerRef.current;
      if (!container) {
        return;
      }

      const focusables = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter(
        (el) =>
          el.offsetParent !== null ||
          el.getClientRects().length > 0 ||
          el === document.activeElement,
      );

      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !container.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !container.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocus && previousFocus.isConnected) {
        previousFocus.focus();
      }
    };
  }, [open, containerRef, initialFocusRef, locked, onClose]);
};
