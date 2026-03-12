"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ExpandableCardProps {
  date: string;
  summary: ReactNode;
  children: ReactNode;
}

export function ExpandableCard({ date, summary, children }: ExpandableCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer pb-2 hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardDescription>{date}</CardDescription>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  open && "rotate-180"
                )}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CardContent className="space-y-2 text-sm">
          {summary}
          <CollapsibleContent className="space-y-2">
            {children}
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}
