"use client";

import { useEffect, useState } from "react";
import { registerToastHandler } from "@/components/ui/Misc";

interface ToastItem {
  id: number;
  message: string;
  kind: "success" | "error";
}

let counter = 0;

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    registerToastHandler((message, kind = "success") => {
      const id = ++counter;
      setItems((prev) => [...prev, { id, message, kind }]);
      setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    });
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4 safe-top">
      {items.map((item) => (
        <div
          key={item.id}
          className={`pointer-events-auto max-w-sm rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${
            item.kind === "success" ? "bg-gray-900" : "bg-red-600"
          }`}
        >
          {item.message}
        </div>
      ))}
    </div>
  );
}
