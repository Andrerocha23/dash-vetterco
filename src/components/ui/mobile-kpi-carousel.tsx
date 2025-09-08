import { ReactNode } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface MobileKpiCarouselProps {
  children: ReactNode;
}

export function MobileKpiCarousel({ children }: MobileKpiCarouselProps) {
  return (
    <div className="md:hidden">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 pb-4 [-webkit-overflow-scrolling:touch]">
          {children}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}