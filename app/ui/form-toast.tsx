"use client";

import { useEffect, useState } from "react";

export function FormToast({ message }: { message: string }) {
  const [dismissedMessage, setDismissedMessage] = useState<string | null>(null);
  const visible = Boolean(message) && dismissedMessage !== message;

  useEffect(() => {
    if (!message || dismissedMessage === message) {
      return;
    }

    const timeout = window.setTimeout(() => setDismissedMessage(message), 4500);
    return () => window.clearTimeout(timeout);
  }, [dismissedMessage, message]);

  if (!message || !visible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-50 flex justify-center px-4">
      <div
        role="alert"
        aria-live="assertive"
        className="toast-in flex w-full max-w-sm items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-left shadow-lg shadow-red-950/10"
      >
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            className="size-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8.25v4.5m0 3h.008v.008H12v-.008ZM10.3 3.8 2.4 17.5A1.5 1.5 0 0 0 3.7 19.8h16.6a1.5 1.5 0 0 0 1.3-2.3L13.7 3.8a2 2 0 0 0-3.4 0Z"
            />
          </svg>
        </span>
        <span className="text-sm font-medium text-red-900">{message}</span>
        <button
          type="button"
          onClick={() => setDismissedMessage(message)}
          aria-label="Fechar aviso"
          className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-full text-red-400 transition-colors hover:bg-red-100 hover:text-red-700"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            className="size-4"
          >
            <path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
