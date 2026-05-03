import { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export default function Button({ variant = "primary", className, ...props }: ButtonProps) {
  const variantClass = {
    primary: "bg-[color:var(--tbh-red)] text-white hover:opacity-90",
    secondary: "border border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900",
    ghost: "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
    danger: "border border-rose-300 text-rose-700 hover:bg-rose-50",
  }[variant];

  return (
    <button
      className={`rounded-md px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variantClass} ${className ?? ""}`}
      {...props}
    />
  );
}
