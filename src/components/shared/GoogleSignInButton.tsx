"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/useAuthStore";

interface GoogleSignInButtonProps {
  role?: "PATIENT" | "ADMIN";
  onSuccess: (isNewUser: boolean) => void;
  onError: (error: string) => void;
}

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleInitializeConfig {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  locale?: string;
}

interface GoogleRenderButtonConfig {
  theme: "outline" | "filled_blue" | "filled_black";
  size: "large" | "medium" | "small";
  type: "standard" | "icon";
  shape: "rectangular" | "pill" | "circle" | "square";
  text: "signup_with" | "continue_with";
  logo_alignment: "left" | "center";
  width: number;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleInitializeConfig) => void;
          renderButton: (parent: HTMLElement, config: GoogleRenderButtonConfig) => void;
        };
      };
    };
  }
}

export function GoogleSignInButton({ role, onSuccess, onError }: GoogleSignInButtonProps) {
  const { locale } = useTranslation();
  const { loginWithGoogle } = useAuthStore();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  const rawClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";
  const googleClientId = rawClientId.replace(/^['"]|['"]$/g, "");
  const hasValidClientId = /^\d+-[a-z0-9-]+\.apps\.googleusercontent\.com$/i.test(googleClientId);

  useEffect(() => {
    if (!hasValidClientId) {
      return;
    }

    // If google client is already loaded
    if (window.google?.accounts?.id) {
      queueMicrotask(() => setIsReady(true));
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>("script[data-google-gsi='true']");
    if (existingScript) {
      existingScript.addEventListener("load", () => setIsReady(true), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleGsi = "true";
    script.onload = () => setIsReady(true);
    document.body.appendChild(script);
  }, [hasValidClientId]);

  useEffect(() => {
    if (!hasValidClientId || !isReady || !buttonRef.current || !window.google) return;

    buttonRef.current.innerHTML = "";

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: async (response: GoogleCredentialResponse) => {
        const result = await loginWithGoogle(response.credential, role);
        if (result.success) {
          onSuccess(result.isNewUser || false);
        } else {
          onError(result.error || "Google login failed");
        }
      },
      locale: locale === "ar" ? "ar" : "en",
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      type: "standard",
      shape: "rectangular",
      text: role === "ADMIN" ? "signup_with" : "continue_with",
      logo_alignment: "center",
      width: buttonRef.current.offsetWidth || 300,
    });
  }, [hasValidClientId, isReady, role, locale, onSuccess, onError, loginWithGoogle, googleClientId]);

  if (!hasValidClientId) {
    return (
      <button
        type="button"
        disabled
        className="w-full max-w-sm h-11 rounded-md border border-border bg-muted/40 text-muted-foreground text-sm font-medium inline-flex items-center justify-center gap-2 cursor-not-allowed"
        title="Google sign-in will be enabled in a future step"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-1.4 3.5-5.5 3.5-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C17 2.9 14.7 2 12 2 6.9 2 2.8 6.1 2.8 11.2S6.9 20.4 12 20.4c6.9 0 9.2-4.8 9.2-7.3 0-.5-.1-.9-.1-1.3H12z"/>
          <path fill="#34A853" d="M3.8 7.3l3.2 2.3c.9-1.8 2.8-3 5-3 1.9 0 3.2.8 3.9 1.5l2.7-2.6C17 2.9 14.7 2 12 2 8.4 2 5.2 4 3.8 7.3z"/>
          <path fill="#4A90E2" d="M12 20.4c2.6 0 4.8-.8 6.4-2.2l-3-2.4c-.8.5-1.9.9-3.4.9-4.1 0-5.2-2.8-5.4-3.4l-3.3 2.5c1.4 3.4 4.7 5.6 8.7 5.6z"/>
          <path fill="#FBBC05" d="M3.3 8.2C3 9.1 2.8 10.1 2.8 11.2c0 1 .2 2.1.5 3l3.3-2.5c-.2-.5-.2-1-.2-1.5s.1-1 .2-1.5L3.3 8.2z"/>
        </svg>
        <span>{locale === "ar" ? "تسجيل Google قريبًا" : "Google Sign-In Coming Soon"}</span>
      </button>
    );
  }

  return (
    <div className="w-full flex justify-center" ref={buttonRef}>
    </div>
  );
}
