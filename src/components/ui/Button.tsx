"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import Link from "next/link";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "whatsapp";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-300",
  secondary: "bg-brand-50 text-brand-800 hover:bg-brand-100 active:bg-brand-200",
  outline: "border border-gray-300 text-gray-800 bg-white hover:bg-gray-50 active:bg-gray-100",
  ghost: "text-gray-700 hover:bg-gray-100 active:bg-gray-200",
  danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:bg-red-300",
  whatsapp: "bg-[#25D366] text-white hover:bg-[#1ebe59] active:bg-[#17a34a]",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-sm px-3 py-2 rounded-lg",
  md: "text-sm px-4 py-2.5 rounded-xl",
  lg: "text-base px-5 py-3.5 rounded-xl",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, fullWidth, className = "", children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-2 font-medium tap-target transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? "w-full" : ""} ${className}`}
        {...props}
      >
        {loading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  fullWidth,
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 font-medium tap-target transition-colors ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {children}
    </Link>
  );
}
