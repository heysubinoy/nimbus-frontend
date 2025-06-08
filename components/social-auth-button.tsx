"use client";

import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

interface SocialAuthButtonProps {
  provider: string;
  icon: LucideIcon;
  onClick: () => void;
  isLoading?: boolean;
}

export function SocialAuthButton({
  provider,
  icon: Icon,
  onClick,
  isLoading,
}: SocialAuthButtonProps) {
  return (
    <Button
      variant="outline"
      className="w-full flex items-center justify-center gap-2"
      onClick={onClick}
      disabled={isLoading}
    >
      <Icon className="h-4 w-4" />
      <span>{isLoading ? `Signing in with ${provider}...` : provider}</span>
    </Button>
  );
}
