"use client";

import { Loader2 } from "lucide-react";
import { ButtonHTMLAttributes } from "react";
import { Button } from "./button";

interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  pending: boolean;
}

/** Dashboard submit. app/join still uses submit-button-legacy.tsx. */
export function SubmitButton({ pending, children, className, ...rest }: SubmitButtonProps) {
  return (
    <Button type="submit" disabled={pending || rest.disabled} className={className} {...rest}>
      {pending && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  );
}
