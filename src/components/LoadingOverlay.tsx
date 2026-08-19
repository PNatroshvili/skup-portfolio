"use client";

import { useEffect, useState } from "react";

/**
 * Skeleton screen shown over the page until the Georgian webfonts have loaded,
 * so the first thing a visitor sees isn't a flash of fallback type. The real
 * markup sits underneath the whole time — this only covers it.
 */
export default function LoadingOverlay() {
  const [done, setDone] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const finish = () => {
      if (cancelled) return;
      setDone(true);
      // Unmount after the fade so the overlay never traps clicks.
      window.setTimeout(() => !cancelled && setGone(true), 500);
    };

    const fonts = document.fonts;
    const ready = fonts ? fonts.ready : Promise.resolve();
    // Never hold the page hostage if font loading stalls.
    const failsafe = window.setTimeout(finish, 2000);

    ready.then(() => {
      window.clearTimeout(failsafe);
      finish();
    });

    return () => {
      cancelled = true;
      window.clearTimeout(failsafe);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] bg-bg transition-opacity duration-500 ${
        done ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="mx-auto flex h-full max-w-6xl flex-col px-6">
        <div className="flex items-center justify-between py-6">
          <div className="flex items-center gap-2.5">
            <div className="skeleton h-8 w-8 rounded-[10px]" />
            <div className="space-y-1.5">
              <div className="skeleton h-3 w-14" />
              <div className="skeleton h-2 w-10" />
            </div>
          </div>
          <div className="hidden gap-7 md:flex">
            {[52, 64, 58, 48].map((w, i) => (
              <div key={i} className="skeleton h-3" style={{ width: w }} />
            ))}
          </div>
          <div className="skeleton h-7 w-11 rounded-full" />
        </div>

        <div className="flex flex-1 flex-col justify-center gap-4 pb-24">
          <div className="skeleton h-3 w-28" />
          <div className="skeleton h-12 w-[min(560px,88%)] md:h-16" />
          <div className="skeleton h-12 w-[min(420px,70%)] md:h-16" />
          <div className="mt-3 space-y-2.5">
            <div className="skeleton h-3.5 w-[min(480px,80%)]" />
            <div className="skeleton h-3.5 w-[min(360px,62%)]" />
          </div>
          <div className="mt-6 flex gap-3">
            <div className="skeleton h-11 w-40 rounded-full" />
            <div className="skeleton h-11 w-32 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
