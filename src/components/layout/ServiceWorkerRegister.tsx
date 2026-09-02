"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Register once the page has settled so it never competes with the
    // initial render for bandwidth/CPU.
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Service worker registration failed:", err);
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
