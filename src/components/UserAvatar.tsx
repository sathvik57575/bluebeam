import Image from "next/image";
import avatardefault from "../assets/avatar-placeholder.png";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  className?: string;
  avatarUrl: string | null | undefined;
  size?: number;
}

export function UserAvatar({ className, avatarUrl, size }: UserAvatarProps) {
  return (
    <Image
      src={avatarUrl || avatardefault}
      alt="user-avatar"
      height={size ?? 48}
      width={size ?? 48}
      className={cn(
        "aspect-square h-fit flex-none rounded-full bg-secondary object-cover",
        className,
      )}
      priority
    />
  );
}
