import { Loader2 } from "lucide-react";
import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99]";

    const variants = {
      primary: "bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm",
      secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
      outline: "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 shadow-sm",
      ghost: "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900",
      danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
    };

    const sizes = {
      sm: "text-xs px-3 py-1.5 h-8",
      md: "text-sm px-4 py-2.5 h-10",
      lg: "text-base px-5 py-3 h-12",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`.trim()}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
