import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode, CSSProperties } from "react";

import { cn } from "@/utils/cn";

const clamp = (value: number, min: number, max: number) => {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
};

interface Constraints {
  min: number;
  max: number;
}

export interface ResizablePanelsProps {
  primary: ReactNode;
  secondary: ReactNode;
  /**
   * Initial width ratio for the primary pane (0 - 1).
   */
  initialRatio?: number;
  /** Minimum width for the primary pane in pixels. */
  minPrimaryWidth?: number;
  /** Minimum width for the secondary pane in pixels. */
  minSecondaryWidth?: number;
  /** Maximum width for the primary pane in pixels. */
  maxPrimaryWidth?: number;
  /** Maximum width for the secondary pane in pixels. */
  maxSecondaryWidth?: number;
  /**
   * Optional localStorage key used to persist the split ratio.
   * When omitted, the ratio will not be persisted.
   */
  storageKey?: string;
  /** Additional class names for the container. */
  className?: string;
  /** Accessible label for the resize handle. */
  handleLabel?: string;
}

const DEFAULT_RATIO = 0.65;
const KEYBOARD_STEP = 16;

export function ResizablePanels({
  primary,
  secondary,
  initialRatio = DEFAULT_RATIO,
  minPrimaryWidth = 280,
  minSecondaryWidth = 280,
  maxPrimaryWidth,
  maxSecondaryWidth,
  storageKey = "cosmoscope:resizable-panels",
  className,
  handleLabel = "Resize panels",
}: ResizablePanelsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const readInitialRatio = useCallback(() => {
    if (typeof window === "undefined") {
      return clamp(initialRatio, 0, 1);
    }

    try {
      const stored = storageKey ? window.localStorage.getItem(storageKey) : null;
      if (!stored) {
        return clamp(initialRatio, 0, 1);
      }
      const parsed = Number.parseFloat(stored);
      if (!Number.isFinite(parsed)) {
        return clamp(initialRatio, 0, 1);
      }
      return clamp(parsed, 0, 1);
    } catch (error) {
      console.warn("Failed to read persisted panel ratio", error);
      return clamp(initialRatio, 0, 1);
    }
  }, [initialRatio, storageKey]);

  const [ratio, setRatio] = useState<number>(() => readInitialRatio());
  const ratioRef = useRef(ratio);
  const [isDragging, setIsDragging] = useState(false);

  const calculateConstraints = useCallback(
    (width?: number): Constraints => {
      const container = containerRef.current;
      const containerSize = width ?? container?.getBoundingClientRect().width ?? 0;

      if (!containerSize) {
        return { min: 0, max: 1 };
      }

      let minRatio = (minPrimaryWidth ?? 0) / containerSize;
      let maxRatio = 1 - (minSecondaryWidth ?? 0) / containerSize;

      if (typeof maxPrimaryWidth === "number") {
        maxRatio = Math.min(maxRatio, maxPrimaryWidth / containerSize);
      }
      if (typeof maxSecondaryWidth === "number") {
        const minFromSecondary = 1 - maxSecondaryWidth / containerSize;
        minRatio = Math.max(minRatio, minFromSecondary);
      }

      if (minRatio > maxRatio) {
        const midpoint = clamp((minRatio + maxRatio) / 2 || 0.5, 0, 1);
        minRatio = midpoint;
        maxRatio = midpoint;
      }

      return {
        min: clamp(minRatio, 0, 1),
        max: clamp(maxRatio, 0, 1),
      };
    },
    [maxPrimaryWidth, maxSecondaryWidth, minPrimaryWidth, minSecondaryWidth],
  );

  const applyConstraints = useCallback(
    (nextRatio: number, width?: number) => {
      const { min, max } = calculateConstraints(width);
      return clamp(nextRatio, min, max);
    },
    [calculateConstraints],
  );

  useEffect(() => {
    ratioRef.current = ratio;
  }, [ratio]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const width = entry.contentRect.width;
      setContainerWidth(width);
      setRatio((prev) => applyConstraints(prev, width));
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [applyConstraints]);

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(storageKey, ratioRef.current.toString());
    } catch (error) {
      console.warn("Failed to persist panel ratio", error);
    }
  }, [ratio, storageKey]);

  useEffect(() => {
    if (!containerWidth) {
      return;
    }
    setRatio((prev) => applyConstraints(prev, containerWidth));
  }, [applyConstraints, containerWidth]);

  const updateFromPointer = useCallback(
    (clientX: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0) return;
      const offset = clamp(clientX - rect.left, 0, rect.width);
      const next = offset / rect.width;
      setRatio((prev) => {
        const constrained = applyConstraints(next, rect.width);
        return Math.abs(constrained - prev) > 0.0001 ? constrained : prev;
      });
    },
    [applyConstraints],
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      event.preventDefault();
      const pointerId = event.pointerId;
      setIsDragging(true);
      const target = event.currentTarget;
      target.setPointerCapture(pointerId);
      updateFromPointer(event.clientX);

      const handleMove = (moveEvent: PointerEvent) => {
        updateFromPointer(moveEvent.clientX);
      };

      const handleUp = () => {
        setIsDragging(false);
        target.releasePointerCapture(pointerId);
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
      };

      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp, { once: true });
    },
    [updateFromPointer],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0) return;

      const constraints = calculateConstraints(rect.width);

      if (event.key === "Home") {
        event.preventDefault();
        setRatio(constraints.min);
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        setRatio(constraints.max);
        return;
      }

      const step = event.shiftKey ? KEYBOARD_STEP * 2 : KEYBOARD_STEP;
      let delta = 0;

      if (event.key === "ArrowLeft") {
        delta = -step;
      } else if (event.key === "ArrowRight") {
        delta = step;
      } else {
        return;
      }

      event.preventDefault();
      const deltaRatio = delta / rect.width;
      setRatio((prev) => applyConstraints(prev + deltaRatio, rect.width));
    },
    [applyConstraints, calculateConstraints],
  );

  const constraints = useMemo(() => calculateConstraints(containerWidth), [calculateConstraints, containerWidth]);

  const style = useMemo(() => {
    const cssVars: CSSProperties = {
      ["--panel-primary" as string]: `${(ratio * 100).toFixed(2)}%`,
      ["--panel-secondary" as string]: `${((1 - ratio) * 100).toFixed(2)}%`,
    };
    return cssVars;
  }, [ratio]);

  return (
    <div
      ref={containerRef}
      className={cn("resizable-panels", className)}
      data-resizing={isDragging ? "true" : "false"}
      data-orientation="horizontal"
      style={style}
    >
      <div className="resizable-panels__pane resizable-panels__pane--primary">{primary}</div>
      {/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
      <div
        role="separator"
        tabIndex={0}
        aria-orientation="vertical"
        aria-label={handleLabel}
        aria-valuemin={Math.round(constraints.min * 100)}
        aria-valuemax={Math.round(constraints.max * 100)}
        aria-valuenow={Math.round(clamp(ratio, 0, 1) * 100)}
        className={cn("resizable-panels__handle", isDragging && "resizable-panels__handle--active")}
        onPointerDown={handlePointerDown}
        onKeyDown={handleKeyDown}
      >
        <span aria-hidden className="resizable-panels__grip" />
      </div>
      {/* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
      <div className="resizable-panels__pane resizable-panels__pane--secondary">{secondary}</div>
    </div>
  );
}

export default ResizablePanels;
