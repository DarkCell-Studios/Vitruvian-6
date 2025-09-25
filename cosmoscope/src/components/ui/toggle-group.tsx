import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cn } from "@/utils/cn";

type ToggleGroupRootProps = React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>;
type ToggleGroupItemProps = React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>;

export const ToggleGroup = ({ className, ...props }: ToggleGroupRootProps) => (
  <ToggleGroupPrimitive.Root
    className={cn("inline-flex rounded-full border border-white/10 bg-space-mid/70 p-1", className)}
    {...props}
  />
);

export const ToggleGroupItem = ({ className, ...props }: ToggleGroupItemProps) => (
  <ToggleGroupPrimitive.Item
    className={cn(
      "relative rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/70 transition data-[state=on]:bg-neon-blue/30 data-[state=on]:text-white data-[state=on]:shadow-[0_0_12px_rgba(0,246,255,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue",
      className,
    )}
    {...props}
  />
);
