import { HTMLAttributes } from "react";

type BadgeVariant = "neutral" | "success" | "warning" | "danger";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export default function Badge({ variant = "neutral", className, ...props }: BadgeProps) {
  const variantClass = {
    neutral: "border border-slate-300 text-slate-700",
    success: "border border-emerald-300 bg-emerald-50 text-emerald-700",
    warning: "border border-amber-300 bg-amber-50 text-amber-700",
    danger: "border border-rose-300 bg-rose-50 text-rose-700",
  }[variant];

  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${variantClass} ${className ?? ""}`} {...props} />;
}
