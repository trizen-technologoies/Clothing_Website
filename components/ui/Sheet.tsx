"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { lockScroll, unlockScroll } from "@/lib/smooth-scroll";

type Side = "right" | "top" | "center" | "full";

type Props = {
  open: boolean;
  onClose: () => void;
  side?: Side;
  /** id of the visible heading, or a label when there is none. */
  labelledBy?: string;
  label?: string;
  className?: string;
  children: ReactNode;
};

const PLACEMENT: Record<Side, string> = {
  right: "justify-end",
  top: "items-start",
  center: "items-center justify-center p-4",
  full: "",
};

/**
 * Modal sheet built on the native <dialog>: focus trapping, Escape and the
 * top layer come from the browser. Animates in/out via CSS (globals.css).
 */
export function Sheet({ open, onClose, side = "right", labelledBy, label, className = "", children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const openRef = useRef(open);

  useEffect(() => {
    openRef.current = open;
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.removeAttribute("data-closing");
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.setAttribute("data-closing", "");
      const t = window.setTimeout(() => {
        dialog.close();
        dialog.removeAttribute("data-closing");
      }, 230);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  // Freeze smooth scrolling while open so the page can't drift behind the sheet.
  useEffect(() => {
    if (!open) return;
    lockScroll();
    return unlockScroll;
  }, [open]);

  return (
    <dialog
      ref={ref}
      // Wheel events inside the sheet scroll its own content natively.
      data-lenis-prevent
      data-side={side}
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : label}
      className={`sheet fixed inset-0 h-dvh w-full open:flex ${PLACEMENT[side]}`}
      // React bubbles cancel/close through the component tree, so a nested
      // sheet's events would reach this one — only handle our own.
      onCancel={(e) => {
        if (e.target !== e.currentTarget) return;
        e.preventDefault();
        onClose();
      }}
      onClose={(e) => {
        // The browser can force-close a dialog (e.g. repeated Escape); keep state in sync.
        if (e.target === e.currentTarget && openRef.current) onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`sheet-panel ${className}`}>{children}</div>
    </dialog>
  );
}
