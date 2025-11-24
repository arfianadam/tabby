import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { TOAST_ANIMATION_DURATION_MS } from "./constants";

type AnimatedToastProps = {
  isVisible: boolean;
  children: ReactNode;
  onExited?: () => void;
};

const AnimatedToast = ({
  isVisible,
  children,
  onExited,
}: AnimatedToastProps) => {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      frameRef.current = window.requestAnimationFrame(() => {
        setIsAnimatingIn(true);
      });
      return () => {
        if (frameRef.current !== null) {
          window.cancelAnimationFrame(frameRef.current);
          frameRef.current = null;
        }
      };
    }

    setIsAnimatingIn(false);
    if (shouldRender) {
      timeoutRef.current = window.setTimeout(() => {
        setShouldRender(false);
        onExited?.();
      }, TOAST_ANIMATION_DURATION_MS);
    }

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isVisible, onExited, shouldRender]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={`transform transition-all duration-200 ease-out ${
        isAnimatingIn
          ? "translate-y-0 opacity-100 scale-100"
          : "translate-y-3 opacity-0 scale-95"
      }`}
    >
      {children}
    </div>
  );
};

export default AnimatedToast;
