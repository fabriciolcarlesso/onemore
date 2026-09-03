"use client";

import { useEffect, useState, type ReactNode } from "react";

export function ComingSoonButton({
  provider,
  children,
}: {
  provider: "Google" | "Apple";
  children: ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const selectedProvider = (event as CustomEvent<string>).detail;
      setVisible(selectedProvider === provider);
    };

    window.addEventListener("onemore:auth-toast", handleToast);
    return () => window.removeEventListener("onemore:auth-toast", handleToast);
  }, [provider]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const timeout = window.setTimeout(() => setVisible(false), 3200);
    return () => window.clearTimeout(timeout);
  }, [visible]);

  return (
    <>
      <button
        type="button"
        onClick={() =>
          window.dispatchEvent(
            new CustomEvent("onemore:auth-toast", { detail: provider }),
          )
        }
        className="group flex w-20 flex-col items-center gap-2 rounded-lg text-xs font-medium text-slate-600 transition-colors hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-950"
      >
        {children}
      </button>

      {visible ? (
        <div
          className="fixed inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-50 flex justify-center px-4"
        >
          <div
            role="status"
            aria-live="polite"
            className="toast-in flex w-full max-w-sm items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-lg shadow-slate-950/10"
          >
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700"
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
            <span>
              <strong className="block text-sm font-semibold text-slate-950">
                Login com {provider}
              </strong>
              <span className="mt-0.5 block text-xs text-slate-400">
                Essa opção estará disponível em breve.
              </span>
            </span>
            <button
              type="button"
              onClick={() => setVisible(false)}
              aria-label="Fechar aviso"
              className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
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
      ) : null}
    </>
  );
}
