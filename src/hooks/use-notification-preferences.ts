import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface NotificationPreferences {
  cotisation_reminder: boolean;
  cotisation_late: boolean;
  pot_upcoming: boolean;
  obligation_reminder: boolean;
  obligation_late: boolean;
}

const DEFAULTS: NotificationPreferences = {
  cotisation_reminder: true,
  cotisation_late: true,
  pot_upcoming: true,
  obligation_reminder: true,
  obligation_late: true,
};

export const useNotificationPreferences = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notification_preferences", user?.id],
    queryFn: async (): Promise<NotificationPreferences> => {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      if (!data) return DEFAULTS;
      return {
        cotisation_reminder: data.cotisation_reminder,
        cotisation_late: data.cotisation_late,
        pot_upcoming: data.pot_upcoming,
        obligation_reminder: data.obligation_reminder,
        obligation_late: data.obligation_late,
      };
    },
    enabled: !!user,
  });
};

export const useUpdateNotificationPreference = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (update: Partial<NotificationPreferences>) => {
      if (!user) throw new Error("Not authenticated");
      // Upsert
      const { error } = await supabase
        .from("notification_preferences")
        .upsert(
          { user_id: user.id, ...update },
          { onConflict: "user_id" }
        );
      if (error) throw error;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["notification_preferences"] }),
  });
};
