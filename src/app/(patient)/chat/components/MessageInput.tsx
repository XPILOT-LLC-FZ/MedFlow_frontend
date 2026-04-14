"use client";

import React from "react";
import { Loader2, Send } from "lucide-react";

interface MessageInputProps {
  value: string;
  disabled?: boolean;
  isSending?: boolean;
  placeholder: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export function MessageInput({
  value,
  disabled,
  isSending,
  placeholder,
  onChange,
  onSend,
  onKeyDown,
}: MessageInputProps) {
  const canSend = Boolean(value.trim()) && !disabled && !isSending;

  return (
    <div className="border-t bg-background px-4 py-3">
      <div className="flex items-end gap-2">
        <textarea
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border bg-card px-4 py-3 text-sm outline-none ring-offset-background transition placeholder:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={17} />}
        </button>
      </div>
    </div>
  );
}
