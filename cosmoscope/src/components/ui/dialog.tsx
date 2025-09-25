import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "./button";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

export const DialogOverlay = ({ className, ...props }: DialogPrimitive.DialogOverlayProps) => (
  <DialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 bg-space-deep/80 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out",
      className,
    )}
    {...props}
  />
);

DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

export const DialogContent = ({ className, children, ...props }: DialogPrimitive.DialogContentProps) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      className={cn(
        "neon-border fixed left-1/2 top-1/2 max-h-[85vh] w-[90vw] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-neon-blue/40 bg-space-mid/90 p-8 text-white shadow-[0_0_30px_rgba(0,246,255,0.4)] focus:outline-none",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Close"
          className="absolute right-4 top-4 text-neon-blue hover:text-white"
        >
          <X className="h-5 w-5" />
        </Button>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
);

DialogContent.displayName = DialogPrimitive.Content.displayName;

export const DialogTitle = ({ className, ...props }: DialogPrimitive.DialogTitleProps) => (
  <DialogPrimitive.Title
    className={cn("font-mono text-lg uppercase tracking-[0.4em] text-neon-blue", className)}
    {...props}
  />
);
DialogTitle.displayName = DialogPrimitive.Title.displayName;

export const DialogDescription = ({ className, ...props }: DialogPrimitive.DialogDescriptionProps) => (
  <DialogPrimitive.Description className={cn("mt-4 text-sm text-white/70", className)} {...props} />
);
DialogDescription.displayName = DialogPrimitive.Description.displayName;
