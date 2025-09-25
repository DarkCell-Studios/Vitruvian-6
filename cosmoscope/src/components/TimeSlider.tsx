import { useEffect, useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/utils/cn";

interface TimeSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
  disabled?: boolean;
}

export const TimeSlider = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  label = "Time",
  disabled = false,
}: TimeSliderProps) => {
  const [internal, setInternal] = useState(value);

  useEffect(() => {
    setInternal(value);
  }, [value]);

  useEffect(() => {
    if (disabled) return;
    const id = window.setTimeout(() => {
      onChange(internal);
    }, 250);
    return () => window.clearTimeout(id);
  }, [disabled, internal, onChange]);

  const formatted = useMemo(() => new Date(internal).toUTCString(), [internal]);

  return (
    <div className={cn("flex flex-col gap-2", "text-white/80")}>
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em]">
        <span>{label}</span>
        <span className="font-mono text-[0.65rem] text-neon-blue">{formatted}</span>
      </div>
      <Slider
        value={[internal]}
        min={min}
        max={max}
        step={step}
        onValueChange={(val) => setInternal(val[0] ?? internal)}
        label={label}
        disabled={disabled}
        aria-disabled={disabled}
      />
    </div>
  );
};
