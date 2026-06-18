"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

export function LandingNavMobile() {
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      const firstLink = drawerRef.current?.querySelector("a");
      (firstLink as HTMLElement | null)?.focus();
    }
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        ref={buttonRef}
        className="landing-nav__hamburger"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        <span aria-hidden="true" data-open={open} className="landing-nav__ham-line" />
        <span aria-hidden="true" data-open={open} className="landing-nav__ham-line" />
        <span aria-hidden="true" data-open={open} className="landing-nav__ham-line" />
      </button>

      {open && (
        <>
          <div
            className="landing-nav__drawer-backdrop"
            aria-hidden="true"
            onClick={close}
          />
          <div
            ref={drawerRef}
            id="mobile-nav-drawer"
            className="landing-nav__drawer"
            role="dialog"
            aria-label="Navigation menu"
            aria-modal="true"
          >
            <nav aria-label="Mobile site navigation">
              <Link href="/" className="landing-nav__drawer-link" onClick={close}>
                Home
              </Link>
              <Link href="/#team" className="landing-nav__drawer-link" onClick={close}>
                About Us
              </Link>
              <Link href="/contact" className="landing-nav__drawer-link" onClick={close}>
                Contact Us
              </Link>
            </nav>
          </div>
        </>
      )}
    </>
  );
}
