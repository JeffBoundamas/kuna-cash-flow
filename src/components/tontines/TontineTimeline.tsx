import { useMemo } from "react";
import { Check, Star, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TontineMember } from "@/lib/tontine-types";

interface Props {
  members: TontineMember[];
  currentCycle: number;
}

const TontineTimeline = ({ members, currentCycle }: Props) => {
  const sortedMembers = useMemo(
    () => [...members].sort((a, b) => a.position_in_order - b.position_in_order),
    [members]
  );

  return (
    <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
      <div className="flex items-center gap-0 min-w-max py-4">
        {sortedMembers.map((member, i) => {
          const isReceived = member.has_received_pot;
          const isCurrent = member.position_in_order === currentCycle;
          const isMe = member.is_current_user;

          return (
            <div key={member.id} className="flex items-center">
              {/* Node */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                    isReceived
                      ? "border-muted bg-muted text-muted-foreground"
                      : isCurrent
                      ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110"
                      : "border-border bg-card text-muted-foreground"
                  )}
                >
                  {isReceived ? (
                    <Check className="h-4 w-4" />
                  ) : isMe ? (
                    <Star className="h-4 w-4" />
                  ) : isCurrent ? (
                    <span className="text-xs font-bold">●</span>
                  ) : (
                    <Clock className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="text-center max-w-[60px]">
                  <p
                    className={cn(
                      "text-[10px] font-medium truncate",
                      isCurrent ? "text-primary font-bold" : isMe ? "text-gold font-bold" : "text-muted-foreground"
                    )}
                  >
                    {member.member_name}
                  </p>
                  {isMe && !isCurrent && (
                    <span className="text-[9px] text-gold">⭐ Moi</span>
                  )}
                  {isCurrent && (
                    <span className="text-[9px] text-primary font-semibold">Tour actuel</span>
                  )}
                </div>
              </div>

              {/* Connector line */}
              {i < sortedMembers.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-8 mx-1",
                    isReceived ? "bg-muted" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TontineTimeline;
