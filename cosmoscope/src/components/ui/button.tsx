import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg border border-transparent px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue focus-visible:ring-offset-2 focus-visible:ring-offset-space-mid",
  {
    variants: {
      variant: {
        default: "bg-neon-pink/80 text-white shadow-neon hover:bg-neon-pink",
        ghost: "bg-transparent text-white hover:bg-white/10",
        outline: "border-neon-blue/60 text-neon-blue hover:bg-neon-blue/10",
      },
      size: {
        default: "h-10 min-w-[3.5rem]",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = ({ className, variant, size, asChild = false, ...props }: ButtonProps) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
};

Button.displayName = "Button";
