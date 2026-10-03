"use client";

import { Loader2 } from "lucide-react";
import { ButtonHTMLAttributes } from "react";
import { Button } from "./button";

interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  pending: boolean;
}

/** The submit button for the dashboard and app/join. */
export function SubmitButton({ pending, children, className, ...rest }: SubmitButtonProps) {
  return (
    <Button type="submit" disabled={pending || rest.disabled} className={className} {...rest}>
      {pending && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  );
}
