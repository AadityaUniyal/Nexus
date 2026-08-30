import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, hint, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold text-nexus-on-surface font-mono-data tracking-wide uppercase">
            {label}
          </label>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            "tactile-input w-full px-3.5 py-2 text-sm text-nexus-on-surface placeholder:text-nexus-outline transition-all disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-nexus-error focus:ring-red-500/20 focus:border-nexus-error",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-nexus-error font-medium">{error}</p>}
        {hint && !error && <p className="text-xs text-nexus-on-surface-variant">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
