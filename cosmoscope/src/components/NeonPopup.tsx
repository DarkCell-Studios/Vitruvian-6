import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { MissionRef } from "@/adapters/DataAdapter";
import { cn } from "@/utils/cn";

interface NeonPopupProps {
  title: string;
  subtitle?: string;
  summary: string;
  missions?: MissionRef[];
  onTravel?: () => void;
  onClose?: () => void;
  actionLabel?: string;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  footerClassName?: string;
}

export const NeonPopup = ({
  title,
  subtitle,
  summary,
  missions = [],
  onTravel,
  onClose,
  actionLabel = "Travel to the planet",
  children,
  className,
  contentClassName,
  footerClassName,
}: NeonPopupProps) => {
  return (
    <Card className={cn("neon-popup flex w-full max-w-md flex-col overflow-hidden", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
      </CardHeader>
      <CardContent className={cn("flex-1 overflow-y-auto pr-1", contentClassName)}>
        <p className="font-light text-white/80">{summary}</p>
        {missions.length > 0 ? (
          <div className="mt-4">
            <h4 className="font-mono text-xs uppercase tracking-[0.3em] text-neon-pink">Missions</h4>
            <ul className="mt-2 space-y-2 text-sm text-white/70">
              {missions.map((mission) => (
                <li key={mission.id} className="rounded-lg border border-white/5 bg-white/5 p-2">
                  <p className="font-semibold text-white">{mission.name}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-neon-blue">
                    {mission.agency} · {mission.year} · {mission.status}
                  </p>
                  <p className="mt-1 text-xs text-white/70">{mission.summary}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {children}
      </CardContent>
      <CardFooter className={cn("mt-6 flex flex-wrap items-center gap-3", footerClassName)}>
        {onTravel ? (
          <Button onClick={onTravel}>{actionLabel}</Button>
        ) : null}
        {onClose ? (
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
};
