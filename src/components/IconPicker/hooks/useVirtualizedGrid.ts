import { useState, useCallback, useMemo, useRef, useEffect } from "react";

type UseVirtualizedGridOptions = {
  itemCount: number;
  itemHeight: number;
  containerHeight: number;
  columnsPerRow: number;
  overscan?: number;
};

type VirtualizedGridResult = {
  visibleRange: { startRow: number; endRow: number };
  visibleIndices: number[];
  totalHeight: number;
  offsetY: number;
  onScroll: (scrollTop: number) => void;
  scrollTop: number;
};

export const useVirtualizedGrid = ({
  itemCount,
  itemHeight,
  containerHeight,
  columnsPerRow,
  overscan = 2,
}: UseVirtualizedGridOptions): VirtualizedGridResult => {
  const [scrollTop, setScrollTop] = useState(0);
  const lastScrollTop = useRef(0);

  const totalRows = Math.ceil(itemCount / columnsPerRow);
  const totalHeight = totalRows * itemHeight;

  const visibleRange = useMemo(() => {
    const startRow = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleRows = Math.ceil(containerHeight / itemHeight);
    const endRow = Math.min(totalRows, startRow + visibleRows + overscan * 2);
    return { startRow, endRow };
  }, [scrollTop, itemHeight, containerHeight, totalRows, overscan]);

  const visibleIndices = useMemo(() => {
    const indices: number[] = [];
    for (let row = visibleRange.startRow; row < visibleRange.endRow; row++) {
      for (let col = 0; col < columnsPerRow; col++) {
        const index = row * columnsPerRow + col;
        if (index < itemCount) {
          indices.push(index);
        }
      }
    }
    return indices;
  }, [visibleRange, columnsPerRow, itemCount]);

  const offsetY = visibleRange.startRow * itemHeight;

  const onScroll = useCallback((newScrollTop: number) => {
    if (Math.abs(newScrollTop - lastScrollTop.current) > 1) {
      lastScrollTop.current = newScrollTop;
      setScrollTop(newScrollTop);
    }
  }, []);

  useEffect(() => {
    setScrollTop(0);
    lastScrollTop.current = 0;
  }, [itemCount]);

  return {
    visibleRange,
    visibleIndices,
    totalHeight,
    offsetY,
    onScroll,
    scrollTop,
  };
};
