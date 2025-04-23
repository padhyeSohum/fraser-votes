
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface RefreshButtonProps {
  onClick: () => void;
  loading?: boolean;
  className?: string;
  size?: "default" | "sm" | "lg";
}

const RefreshButton = ({ 
  onClick, 
  loading = false,
  className,
  size = "default"
}: RefreshButtonProps) => {
  return (
    <Button
      variant="outline"
      size={size}
      onClick={onClick}
      disabled={loading}
      className={cn("flex items-center gap-1", className)}
    >
      <RefreshCw 
        className={cn(
          "h-4 w-4", 
          loading ? "animate-spin" : ""
        )} 
      />
      <span>{loading ? "Refreshing..." : "Refresh"}</span>
    </Button>
  );
};

export default RefreshButton;
