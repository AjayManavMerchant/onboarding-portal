import type { ReactNode } from "react";

type Variant = "success" | "info" | "warning" | "error";

const STYLES: Record<Variant, string> = {
  success: "border-green-300 bg-green-50 text-green-900",
  info: "border-blue-300 bg-blue-50 text-blue-900",
  warning: "border-amber-300 bg-amber-50 text-amber-900",
  error: "border-red-300 bg-red-50 text-red-900",
};

export function Banner({ variant, children }: { variant: Variant; children: ReactNode }) {
  return (
    <div role={variant === "error" ? "alert" : "status"} className={`rounded-lg border px-4 py-3 text-sm ${STYLES[variant]}`}>
      {children}
    </div>
  );
}
