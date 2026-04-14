"use client";

import { MessageSquare, UserRound, Stethoscope } from "lucide-react";

export interface ConversationListItem {
  id: string;
  title: string;
  subtitle: string;
  unreadCount?: number;
}

interface ConversationListProps {
  title: string;
  items: ConversationListItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
  isDoctor: boolean;
}

export function ConversationList({
  title,
  items,
  selectedId,
  onSelect,
  isDoctor,
}: ConversationListProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b bg-background px-4 py-4">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          One chat per patient-doctor pair
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/30 px-3 py-6 text-center text-xs text-muted-foreground">
            No conversations available yet.
          </div>
        ) : null}
        {items.map((item) => {
          const selected = item.id === selectedId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`w-full rounded-xl border px-3 py-3 text-left transition-all ${
                selected
                  ? "border-primary/30 bg-primary/10 shadow-sm ring-1 ring-primary/20"
                  : "bg-card hover:bg-muted/60 hover:shadow-sm"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg border bg-muted/50 p-2 text-muted-foreground">
                  {isDoctor ? <UserRound size={16} /> : <Stethoscope size={16} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.subtitle}</p>
                </div>
                {item.unreadCount && item.unreadCount > 0 ? (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                    {item.unreadCount}
                  </span>
                ) : (
                  <MessageSquare size={14} className="mt-0.5 text-muted-foreground" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
