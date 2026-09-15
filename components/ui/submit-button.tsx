"use client";

import { Loader2 } from "lucide-react";
import { ButtonHTMLAttributes } from "react";
import { buttonClass } from "./button";

interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  pending: boolean;
}

export function SubmitButton({ pending, children, className = "", ...rest }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={pending || rest.disabled}
      className={`${buttonClass("primary")} ${className}`}
      {...rest}
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
