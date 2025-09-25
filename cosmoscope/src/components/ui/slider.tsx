import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/utils/cn";

export interface SliderProps extends SliderPrimitive.SliderProps {
  label?: string;
}

export const Slider = ({ className, label, ...props }: SliderProps) => (
  <SliderPrimitive.Root
    className={cn(
      "relative flex w-full touch-none select-none items-center py-2",
      className,
    )}
    aria-label={label}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-white/10">
      <SliderPrimitive.Range className="absolute h-full bg-neon-blue" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      aria-label={label}
      className="block h-5 w-5 rounded-full border border-neon-blue bg-space-glow shadow-[0_0_12px_rgba(0,246,255,0.7)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue"
    />
  </SliderPrimitive.Root>
);
