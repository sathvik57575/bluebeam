import React, { ComponentProps } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingButtonProps extends ComponentProps<typeof Button>{
    loading: boolean
}

function LoadingButton({
  className,
  type,
  disabled,
  loading,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      type={type}
      className={cn("flex items-center gap-2 dark:text-white", className)}
      {...props}
      data-slot="button"
      disabled = {loading || disabled}
    >
      {loading && <Loader2 className="size-5 animate-spin"/>}
      {props.children} {/* we can remove this */}
    </Button>
  );
}

export { LoadingButton };
