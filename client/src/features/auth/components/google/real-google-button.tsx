"use client";

import { useLocale } from "next-intl";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleIdentity {
  accounts: {
    id: {
      initialize(options: { client_id: string; callback: (response: GoogleCredentialResponse) => void; ux_mode?: "popup" }): void;
      renderButton(element: HTMLElement, options: Record<string, string | number>): void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

/**
 * Google Identity Services button. Produces a signed Google ID token which the backend
 * verifies in POST /auth/google (docs/API.md §3.1).
 */
export function RealGoogleButton({ clientId, onCredential }: { clientId: string; onCredential: (idToken: string) => void }) {
  const locale = useLocale();
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onCredential);
  const [loaded, setLoaded] = useState(() => typeof window !== "undefined" && Boolean(window.google));

  useEffect(() => {
    callback.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!loaded || !container.current || !window.google) return;
    window.google.accounts.id.initialize({ client_id: clientId, ux_mode: "popup", callback: (res) => callback.current(res.credential) });
    window.google.accounts.id.renderButton(container.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "rectangular",
      locale,
      width: container.current.offsetWidth || 320,
    });
  }, [loaded, clientId, locale]);

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => setLoaded(true)} />
      <div ref={container} className="flex min-h-11 w-full justify-center" />
    </>
  );
}
