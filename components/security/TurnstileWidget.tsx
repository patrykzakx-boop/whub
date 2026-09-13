"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

const TURNSTILE_SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      theme: "dark";
      size: "flexible";
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    }
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type TurnstileWidgetProps = {
  action: string;
  onTokenChange: (token: string) => void;
  resetKey: number;
};

export default function TurnstileWidget({
  action,
  onTokenChange,
  resetKey,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const previousResetKeyRef = useRef(resetKey);
  const [scriptReady, setScriptReady] = useState(false);
  const [status, setStatus] = useState("Ładowanie zabezpieczenia CAPTCHA…");
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const renderWidget = useCallback(() => {
    if (
      !siteKey ||
      !containerRef.current ||
      !window.turnstile ||
      widgetIdRef.current
    ) {
      return;
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      action,
      theme: "dark",
      size: "flexible",
      callback: (token) => {
        setStatus("Weryfikacja CAPTCHA zakończona.");
        onTokenChange(token);
      },
      "expired-callback": () => {
        setStatus("Weryfikacja CAPTCHA wygasła. Spróbuj ponownie.");
        onTokenChange("");
      },
      "error-callback": () => {
        setStatus("Nie udało się załadować CAPTCHA. Odśwież stronę.");
        onTokenChange("");
      },
    });
  }, [action, onTokenChange, siteKey]);

  useEffect(() => {
    if (scriptReady || window.turnstile) renderWidget();
  }, [renderWidget, scriptReady]);

  useEffect(() => {
    if (previousResetKeyRef.current === resetKey) return;

    previousResetKeyRef.current = resetKey;
    onTokenChange("");
    setStatus("Potwierdź ponownie, że nie jesteś robotem.");

    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, [onTokenChange, resetKey]);

  useEffect(() => {
    return () => {
      const widgetId = widgetIdRef.current;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
      widgetIdRef.current = null;
    };
  }, []);

  if (!siteKey) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        CAPTCHA nie jest skonfigurowana. Skontaktuj się z administratorem.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Script
        src={TURNSTILE_SCRIPT_URL}
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() =>
          setStatus("Nie udało się załadować CAPTCHA. Odśwież stronę.")
        }
      />
      <div ref={containerRef} className="min-h-[65px] w-full" />
      <p className="sr-only" aria-live="polite">
        {status}
      </p>
    </div>
  );
}
