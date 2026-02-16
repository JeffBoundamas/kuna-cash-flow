import { useMemo } from "react";
import { Check, Star, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { TontineMember } from "@/lib/tontine-types";

interface Props {
  members: TontineMember[];
  currentCycle: number;
  onMemberTap?: (member: TontineMember) => void;
}

const TontineTimeline = ({ members, currentCycle, onMemberTap }: Props) => {
  const sortedMembers = useMemo(
    () => [...members].sort((a, b) => a.position_in_order - b.position_in_order),
    [members]
  );

  return (
    <div
      className="overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <div className="flex items-start gap-0 min-w-max pt-2 pb-2">
        {sortedMembers.map((member, i) => {
          const isReceived = member.has_received_pot;
          const isCurrent = member.position_in_order === currentCycle;
          const isMe = member.is_current_user;
          const isMyTurn = isCurrent && isMe;
          const hasPhone = !!member.phone_number;

          return (
            <div key={member.id} className="flex items-start">
              {/* Node */}
              <div
                className="flex flex-col items-center gap-1.5 relative cursor-pointer"
                onClick={() => onMemberTap?.(member)}
              >
                {/* "C'est votre tour" callout */}
                {isMyTurn && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap"
                  >
                    <span className="inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-0.5 text-[9px] font-bold text-gold-foreground shadow-md">
                      <Sparkles className="h-2.5 w-2.5" />
                      Votre tour !
                    </span>
                    <div className="mx-auto w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gold" />
                  </motion.div>
                )}

                {/* Circle */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "relative flex items-center justify-center rounded-full border-2 transition-all",
                    isReceived
                      ? "h-10 w-10 border-muted bg-muted text-muted-foreground"
                      : isCurrent
                      ? "h-12 w-12 border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                      : isMe
                      ? "h-10 w-10 border-gold bg-gold-muted text-gold ring-2 ring-gold/40"
                      : "h-10 w-10 border-border bg-card text-muted-foreground"
                  )}
                >
                  {isReceived ? (
                    <Check className="h-4 w-4" />
                  ) : isMe ? (
                    <Star className="h-4 w-4 fill-current" />
                  ) : isCurrent ? (
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-foreground opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-foreground" />
                    </span>
                  ) : (
                    <span className="text-xs font-semibold">{member.position_in_order}</span>
                  )}

                  {/* Position badge */}
                  {isCurrent && !isMe && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground border border-background">
                      {member.position_in_order}
                    </span>
                  )}
                </motion.div>

                {/* Label */}
                <div className="text-center max-w-[64px]">
                  <p
                    className={cn(
                      "text-[10px] font-medium truncate leading-tight",
                      isCurrent ? "text-primary font-bold" : isMe ? "text-gold font-bold" : "text-muted-foreground"
                    )}
                  >
                    {member.member_name}
                  </p>
                  {isMe && !isCurrent && (
                    <span className="text-[9px] text-gold font-semibold">⭐ Moi</span>
                  )}
                  {isCurrent && !isMe && (
                    <span className="text-[9px] text-primary font-semibold">En cours</span>
                  )}
                  {isReceived && (
                    <span className="text-[9px] text-muted-foreground">Reçu ✓</span>
                  )}
                  {hasPhone && !isReceived && !isCurrent && (
                    <span className="text-[8px] text-[#25D366]">📱</span>
                  )}
                </div>
              </div>

              {/* Connector line */}
              {i < sortedMembers.length - 1 && (
                <div className="flex items-center mt-[22px]">
                  <div
                    className={cn(
                      "h-0.5 w-10 mx-0.5 rounded-full transition-all",
                      isReceived ? "bg-muted-foreground/20" : "bg-border"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TontineTimeline;
