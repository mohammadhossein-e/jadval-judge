'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Maximize2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';

const MIN_SCALE = 0.05;
const MAX_SCALE = 3;
const ZOOM_STEP = 0.25;
const DRAG_THRESHOLD = 4;

interface ZoomableBracketProps {
  contentWidth: number;
  contentHeight: number;
  children: React.ReactNode;
}

interface DragState {
  startX: number;
  startY: number;
  scrollLeft: number;
  scrollTop: number;
  moved: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Scrollable, zoomable, pannable bracket viewport.
 *
 * The bracket content is rendered at its natural layout size and scaled
 * visually with `transform: scale()`. An inner wrapper is sized to
 * `content * scale` so the native scrollbars/scrollable area always match
 * the visible (scaled) content. Panning is the native scroll offset, so
 * scrollbars, plain wheel scrolling, and drag-to-pan all coexist.
 *
 * - Ctrl/Cmd + wheel zooms about the cursor. Plain wheel keeps scrolling.
 * - Zoom In/Out step by 25% (5%..300% bounds).
 * - Fit to Screen scales the whole bracket into the viewport (max 100%).
 * - Reset returns to 100% at the top-left.
 */
export function ZoomableBracket({ contentWidth, contentHeight, children }: ZoomableBracketProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(1);
  const dragRef = useRef<DragState | null>(null);
  const didDragRef = useRef(false);

  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  const applyZoom = useCallback((nextScale: number, focalX: number, focalY: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const current = scaleRef.current;
    const target = clamp(nextScale, MIN_SCALE, MAX_SCALE);
    if (target === current) return;
    const ratio = target / current;
    const scrollLeft = viewport.scrollLeft;
    const scrollTop = viewport.scrollTop;
    setScale(target);
    scaleRef.current = target;
    viewport.scrollLeft = scrollLeft + focalX * (ratio - 1);
    viewport.scrollTop = scrollTop + focalY * (ratio - 1);
  }, []);

  const zoomIn = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    applyZoom(
      scaleRef.current * (1 + ZOOM_STEP),
      viewport.scrollLeft + rect.width / 2,
      viewport.scrollTop + rect.height / 2,
    );
  }, [applyZoom]);

  const zoomOut = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    applyZoom(
      scaleRef.current / (1 + ZOOM_STEP),
      viewport.scrollLeft + rect.width / 2,
      viewport.scrollTop + rect.height / 2,
    );
  }, [applyZoom]);

  const reset = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    setScale(1);
    scaleRef.current = 1;
    viewport.scrollLeft = 0;
    viewport.scrollTop = 0;
  }, []);

  const fitToScreen = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport || contentWidth <= 0 || contentHeight <= 0) return;
    const viewportWidth = viewport.clientWidth;
    const viewportHeight = viewport.clientHeight;
    if (viewportWidth <= 0 || viewportHeight <= 0) return;
    const fitScale = clamp(
      Math.min(1, viewportWidth / contentWidth, viewportHeight / contentHeight),
      MIN_SCALE,
      1,
    );
    setScale(fitScale);
    scaleRef.current = fitScale;
    viewport.scrollLeft = Math.max(0, (contentWidth * fitScale - viewportWidth) / 2);
    viewport.scrollTop = Math.max(0, (contentHeight * fitScale - viewportHeight) / 2);
  }, [contentWidth, contentHeight]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const focalX = e.clientX - rect.left + viewport.scrollLeft;
      const focalY = e.clientY - rect.top + viewport.scrollTop;
      const factor = e.deltaY < 0 ? 1 + ZOOM_STEP : 1 / (1 + ZOOM_STEP);
      applyZoom(scaleRef.current * factor, focalX, focalY);
    };
    viewport.addEventListener('wheel', onWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', onWheel);
  }, [applyZoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
      moved: false,
    };

    const handleMouseMove = (ev: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = ev.clientX - drag.startX;
      const dy = ev.clientY - drag.startY;
      if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      drag.moved = true;
      didDragRef.current = true;
      setIsDragging(true);
      const viewportEl = viewportRef.current;
      if (viewportEl) {
        viewportEl.scrollLeft = drag.scrollLeft - dx;
        viewportEl.scrollTop = drag.scrollTop - dy;
      }
    };

    const handleMouseEnd = () => {
      if (!dragRef.current) return;
      dragRef.current = null;
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseEnd);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseEnd);
  }, []);

  const handleClickCapture = useCallback((e: React.MouseEvent) => {
    if (didDragRef.current) {
      didDragRef.current = false;
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  return (
    <div className="relative">
      <div
        ref={viewportRef}
        data-testid="bracket-viewport"
        className={cn(
          'overflow-x-auto overflow-y-auto pb-4',
          'max-h-[80vh]',
          isDragging ? 'cursor-grabbing select-none' : 'cursor-grab',
        )}
        onMouseDown={handleMouseDown}
        onClickCapture={handleClickCapture}
      >
        <div style={{ width: contentWidth * scale, height: contentHeight * scale }}>
          <div
            className="flex items-start"
            style={{
              width: contentWidth,
              height: contentHeight,
              transform: `scale(${scale})`,
              transformOrigin: '0 0',
            }}
          >
            {children}
          </div>
        </div>
      </div>

      <div
        className="absolute right-2 top-2 z-30 flex items-center gap-0.5 rounded-lg border bg-background/90 p-1 shadow-sm backdrop-blur"
        role="toolbar"
        aria-label="Bracket navigation"
      >
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={zoomOut}
          aria-label="Zoom out"
          title="Zoom out"
        >
          <ZoomOut className="size-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={zoomIn}
          aria-label="Zoom in"
          title="Zoom in"
        >
          <ZoomIn className="size-3" />
        </Button>
        <span
          role="status"
          aria-live="polite"
          aria-label="Current zoom level"
          className="px-1.5 text-xs font-medium tabular-nums text-muted-foreground"
        >
          {Math.round(scale * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={fitToScreen}
          aria-label="Fit to screen"
          title="Fit bracket to screen"
        >
          <Maximize2 className="size-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={reset}
          aria-label="Reset zoom"
          title="Reset zoom to 100%"
        >
          <RotateCcw className="size-3" />
        </Button>
      </div>
    </div>
  );
}
