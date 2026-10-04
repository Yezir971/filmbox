"use client";

import * as React from "react";
import Image from "next/image";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  avatarUrl?: string | null;
  pseudo?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function UserAvatar({
  avatarUrl,
  pseudo = "Utilisateur",
  size = "md",
  className,
}: UserAvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-16 w-16 text-base",
    xl: "h-28 w-28 text-2xl",
  };

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-5 w-5",
    lg: "h-8 w-8",
    xl: "h-14 w-14",
  };

  const hasValidImage = Boolean(avatarUrl && !imageError && avatarUrl.trim() !== "");

  return (
    <div
      className={cn(
        "relative rounded-full border border-gold-500/40 bg-gradient-to-br from-gold-500/20 via-secondary to-card shadow-[0_0_15px_rgba(229,169,60,0.15)] flex items-center justify-center shrink-0 overflow-hidden",
        sizeClasses[size],
        className
      )}
    >
      {hasValidImage ? (
        <Image
          src={avatarUrl!}
          alt={`Avatar de ${pseudo}`}
          fill
          sizes={size === "xl" ? "112px" : size === "lg" ? "64px" : "40px"}
          className="object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <User
          className={cn("text-gold-400 drop-shadow-sm", iconSizes[size])}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
