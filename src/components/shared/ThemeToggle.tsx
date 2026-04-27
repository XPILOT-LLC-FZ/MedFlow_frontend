"use client";

import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/stores/useStore";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  variant?: "outline" | "ghost" | "default";
}

export function ThemeToggle({ 
  className, 
  variant = "outline"
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useStore();

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={toggleTheme}
      className={cn(
        "transition-all duration-300 rounded-xl",
        variant === "outline" && "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800",
        className
      )}
    >
      {theme === "light" ? (
        <Moon className="h-[18px] w-[18px] text-slate-600" />
      ) : (
        <Sun className="h-[18px] w-[18px] text-amber-400" />
      )}
    </Button>
  );
}
