"use client";

import { TURNSTILE_ACTION } from "@/lib/turnstile-config";
import { useEffect, useRef } from "react";

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      size: "flexible";
      callback: (token: string) => void;
      "error-callback": () => void;
      "expired-callback": () => void;
      "timeout-callback": () => void;
      "response-field": false;
    }
  ) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    meetupHubTurnstileLoader?: Promise<TurnstileApi>;
  }
}

type TurnstileWidgetProps = {
  onVerify: (token: string) => void;
  onError: (message: string) => void;
};

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (window.meetupHubTurnstileLoader) return window.meetupHubTurnstileLoader;

  window.meetupHubTurnstileLoader = new Promise((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>(
      "script[data-turnstile]"
    );
    let settled = false;
    if (script?.dataset.turnstileState === "error") {
      script.remove();
      script = null;
    }

    function cleanup() {
      window.clearTimeout(loadTimeout);
      script?.removeEventListener("load", handleLoad);
      script?.removeEventListener("error", handleError);
    }
    function handleLoad() {
      if (settled) return;
      if (script) script.dataset.turnstileState = "loaded";
      if (window.turnstile) {
        settled = true;
        cleanup();
        resolve(window.turnstile);
      } else {
        handleError();
      }
    }
    function handleError() {
      if (settled) return;
      settled = true;
      if (script) script.dataset.turnstileState = "error";
      window.meetupHubTurnstileLoader = undefined;
      cleanup();
      reject(new Error("Turnstile failed to load"));
    }

    const loadTimeout = window.setTimeout(handleError, 10_000);

    if (!script) {
      script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.dataset.turnstile = "true";
      script.dataset.turnstileState = "loading";
      script.addEventListener("load", handleLoad, { once: true });
      script.addEventListener("error", handleError, { once: true });
      document.body.appendChild(script);
    } else if (script.dataset.turnstileState === "loaded") {
      handleLoad();
    } else {
      script.addEventListener("load", handleLoad, { once: true });
      script.addEventListener("error", handleError, { once: true });
    }
  });

  return window.meetupHubTurnstileLoader;
}

export function TurnstileWidget({ onVerify, onError }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onVerifyRef = useRef(onVerify);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onVerifyRef.current = onVerify;
    onErrorRef.current = onError;
  }, [onVerify, onError]);

  useEffect(() => {
    let isMounted = true;
    let widgetId: string | undefined;
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    if (!siteKey) {
      onErrorRef.current("Verification is unavailable. Try again later.");
      return;
    }

    void loadTurnstile()
      .then((turnstile) => {
        if (!isMounted || !containerRef.current) return;

        widgetId = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action: TURNSTILE_ACTION,
          size: "flexible",
          "response-field": false,
          callback: (token) => {
            if (isMounted) onVerifyRef.current(token);
          },
          "error-callback": () => {
            if (isMounted) onErrorRef.current("Verification failed. Try again.");
          },
          "expired-callback": () => {
            if (isMounted) onErrorRef.current("Verification expired. Try again.");
          },
          "timeout-callback": () => {
            if (isMounted) onErrorRef.current("Verification timed out. Try again.");
          },
        });
      })
      .catch(() => {
        if (isMounted) {
          onErrorRef.current("Verification is unavailable. Try again later.");
        }
      });

    return () => {
      isMounted = false;
      if (widgetId && window.turnstile) {
        window.turnstile.remove(widgetId);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="min-h-[65px] w-full"
      aria-label="Human verification"
    />
  );
}
