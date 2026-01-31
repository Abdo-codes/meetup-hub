"use client";

import { useEffect, useRef } from "react";

type TurnstileWidgetProps = {
  onVerify: (token: string) => void;
  onError?: () => void;
};

export function TurnstileWidget({ onVerify, onError }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    if (!siteKey || !containerRef.current) return;

    const renderWidget = () => {
      // @ts-expect-error - turnstile is injected globally
      if (!window.turnstile || !containerRef.current) return;
      // @ts-expect-error - turnstile is injected globally
      window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          if (isMounted) onVerify(token);
        },
        "error-callback": () => {
          if (isMounted && onError) onError();
        },
      });
    };

    if (!document.querySelector("script[data-turnstile]")) {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.dataset.turnstile = "true";
      script.onload = renderWidget;
      document.body.appendChild(script);
    } else {
      renderWidget();
    }

    return () => {
      isMounted = false;
    };
  }, [onVerify, onError]);

  return <div ref={containerRef} />;
}
