import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MobileTableCardProps {
  title: string;
  subtitle?: string;
  badges?: Array<{
    label: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
    className?: string;
  }>;
  actions?: ReactNode;
  children?: ReactNode;
  onClick?: () => void;
}

export function MobileTableCard({
  title,
  subtitle,
  badges,
  actions,
  children,
  onClick
}: MobileTableCardProps) {
  return (
    <Card 
      className={`surface-elevated ${onClick ? "cursor-pointer hover:shadow-lg transition-shadow" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {badges && badges.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {badges.map((badge, index) => (
              <Badge
                key={index}
                variant={badge.variant || "outline"}
                className={badge.className}
              >
                {badge.label}
              </Badge>
            ))}
          </div>
        )}

        {children && (
          <div className="mb-3">
            {children}
          </div>
        )}

        {actions && (
          <div className="flex gap-2 pt-2 border-t border-border">
            {actions}
          </div>
        )}
      </CardContent>
    </Card>
  );
}