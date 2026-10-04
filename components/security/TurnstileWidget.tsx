"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

    try {
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
          setStatus("Nie udało się załadować CAPTCHA. Spróbuj ponownie później.");
          onTokenChange("");
        },
      });
    } catch (error) {
      console.error("Nie udało się uruchomić Turnstile", error);
      setStatus("Nie udało się załadować CAPTCHA. Spróbuj ponownie później.");
      onTokenChange("");
    }
  }, [action, onTokenChange, siteKey]);

  useEffect(() => {
    let attempts = 0;

    const tryRender = () => {
      if (window.turnstile) {
        renderWidget();
        return true;
      }

      attempts += 1;
      if (attempts >= 100) {
        setStatus("Nie udało się załadować CAPTCHA. Spróbuj ponownie później.");
        return true;
      }

      return false;
    };

    if (tryRender()) return;

    const intervalId = window.setInterval(() => {
      if (tryRender()) window.clearInterval(intervalId);
    }, 100);

    return () => window.clearInterval(intervalId);
  }, [renderWidget]);

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
      <div ref={containerRef} className="min-h-[65px] w-full" />
      <p className="sr-only" aria-live="polite">
        {status}
      </p>
    </div>
  );
}
