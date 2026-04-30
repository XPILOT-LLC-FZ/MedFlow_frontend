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
    <div className="bg-[#F8FAFC]/80 dark:bg-slate-950/80 px-4 py-6 backdrop-blur-xl border-t dark:border-slate-900 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-full px-4 py-1.5 shadow-lg shadow-slate-200/40 dark:shadow-none border border-slate-100 dark:border-slate-700">
          {/* Attachment Button */}
          <button
            type="button"
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-[#4F46E5] transition-all hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <Paperclip size={22} className="rotate-45" />
          </button>

          {/* Text Area */}
          <div className="flex-1">
            <textarea
              rows={1}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Type your message..."
              disabled={disabled}
              className="block w-full max-h-32 min-h-[48px] resize-none border-none bg-transparent px-1 py-3 text-[15px] outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-50"
            />
          </div>

          {/* Send or Mic Button */}
          <button
            type="button"
            onClick={canSend ? onSend : undefined}
            disabled={disabled}
            className={cn(
              "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition-all duration-300",
              canSend 
                ? "text-[#4F46E5] hover:bg-slate-50 dark:hover:bg-slate-700" 
                : "text-[#4F46E5] hover:bg-slate-50 dark:hover:bg-slate-700"
            )}
          >
            {isSending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : canSend ? (
              <SendHorizontal size={22} />
            ) : (
              <Mic size={22} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
