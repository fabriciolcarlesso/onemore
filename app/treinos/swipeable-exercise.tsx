"use client";

import { useRef, useState, type PointerEvent, type ReactNode } from "react";

export function SwipeableExercise({ children, canRemove, onRemove, label }: { children: ReactNode; canRemove: boolean; onRemove: () => void; label: string }) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const swiping = useRef(false);
  const suppressClick = useRef(false);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  function move(event: PointerEvent<HTMLDivElement>) {
    if (!canRemove || !start.current) return;
    const dx = event.clientX - start.current.x;
    const dy = event.clientY - start.current.y;
    if (!dragging && (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.2)) return;
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
    swiping.current = true;
    setDragging(true);
    setOffset(Math.max(-130, Math.min(130, dx)));
  }

  function finish(event: PointerEvent<HTMLDivElement>) {
    if (!start.current) return;
    const distance = event.clientX - start.current.x;
    start.current = null;
    setDragging(false);
    setOffset(0);
    if (swiping.current) {
      suppressClick.current = true;
      setTimeout(() => { suppressClick.current = false; }, 0);
      if (canRemove && Math.abs(distance) >= 90) onRemove();
    }
    swiping.current = false;
  }

  return <div className="relative rounded-xl bg-red-100 [touch-action:pan-y]" onPointerDown={(event) => { if (canRemove && event.button === 0) start.current = { x: event.clientX, y: event.clientY }; }} onPointerMove={move} onPointerUp={finish} onPointerCancel={() => { start.current = null; swiping.current = false; setDragging(false); setOffset(0); }} onClickCapture={(event) => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); } }}>
    {canRemove ? <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-red-700">{Math.abs(offset) >= 90 ? "Solte para remover" : "Arraste para remover"}</div> : null}
    <div className={`relative bg-white ${dragging ? "" : "transition-transform duration-150"}`} style={offset ? { transform: `translateX(${offset}px)` } : undefined}>
      {canRemove ? <button type="button" onClick={onRemove} aria-label={`Remover ${label}`} className="sr-only focus:not-sr-only focus:absolute focus:right-2 focus:top-2 focus:z-10 focus:rounded-lg focus:bg-red-600 focus:px-3 focus:py-2 focus:text-white">Remover</button> : null}
      {children}
    </div>
  </div>;
}
