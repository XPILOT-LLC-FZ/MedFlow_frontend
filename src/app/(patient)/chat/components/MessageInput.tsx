"use client";

import React from "react";
import { Loader2, SendHorizontal, Paperclip, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div className="bg-slate-50/50 dark:bg-slate-900/50 px-6 py-6 backdrop-blur-md border-t dark:border-slate-800">
      <div className="relative max-w-4xl mx-auto">
        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-[32px] px-4 py-2 shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-100 dark:border-slate-700">
          {/* Attachment Button */}
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-blue-500 transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            <Paperclip size={20} className="rotate-45" />
          </button>

          {/* Text Area */}
          <div className="flex-1">
            <textarea
              rows={1}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className="block w-full max-h-32 min-h-[44px] resize-none border-none bg-transparent px-2 py-3 text-[15px] outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-50"
            />
          </div>

          {/* Send or Mic Button */}
          <button
            type="button"
            onClick={canSend ? onSend : undefined}
            disabled={disabled}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300",
              canSend 
                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95" 
                : "text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            )}
          >
            {isSending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : canSend ? (
              <SendHorizontal size={18} className="translate-x-0.5" />
            ) : (
              <Mic size={20} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
