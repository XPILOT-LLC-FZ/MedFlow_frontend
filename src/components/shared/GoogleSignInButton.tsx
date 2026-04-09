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

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, config: any) => void;
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

  useEffect(() => {
    // If google client is already loaded
    if (window.google?.accounts?.id) {
      setIsReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setIsReady(true);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!isReady || !buttonRef.current || !window.google) return;

    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
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
  }, [isReady, role, locale, onSuccess, onError, loginWithGoogle]);

  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    if (process.env.NODE_ENV === "development") {
      return <div className="text-xs text-red-500 text-center">Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID</div>;
    }
    return null;
  }

  return (
    <div className="w-full flex justify-center" ref={buttonRef}>
    </div>
  );
}
