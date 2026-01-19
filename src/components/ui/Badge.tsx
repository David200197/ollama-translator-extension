import * as React from "react";
import { cn } from "../../lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "destructive";
}

export const Badge = ({ className, variant = "default", ...props }: BadgeProps) => {
  const variants = {
    default: "bg-primary text-primary-foreground",
    success: "badge-success",
    warning: "badge-warning",
    destructive: "badge-destructive"
  };

  return (
    <span
      className={cn("badge", variants[variant], className)}
      {...props}
    />
  );
};
