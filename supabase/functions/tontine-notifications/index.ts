import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Get all active tontines with their members
    const { data: tontines, error: tErr } = await supabase
      .from("tontines")
      .select("*")
      .eq("status", "active");

    if (tErr) throw tErr;

    const notifications: Array<{
      user_id: string;
      type: string;
      title: string;
      body: string;
      related_tontine_id: string;
    }> = [];

    for (const tontine of tontines ?? []) {
      const { data: members } = await supabase
        .from("tontine_members")
        .select("*")
        .eq("tontine_id", tontine.id)
        .order("position_in_order", { ascending: true });

      if (!members || members.length === 0) continue;

      const userId = tontine.user_id;
      const potAmount = tontine.contribution_amount * tontine.total_members;

      // Calculate current cycle due date
      const startDate = new Date(tontine.start_date);
      const cycleDueDate = new Date(startDate);
      if (tontine.frequency === "monthly") {
        cycleDueDate.setMonth(cycleDueDate.getMonth() + (tontine.current_cycle - 1));
      } else {
        cycleDueDate.setDate(cycleDueDate.getDate() + (tontine.current_cycle - 1) * 7);
      }
      const cycleDueDateStr = cycleDueDate.toISOString().split("T")[0];

      // TRIGGER 1: Cotisation reminder — 3 days before due
      const reminderDate = new Date(cycleDueDate);
      reminderDate.setDate(reminderDate.getDate() - 3);
      const reminderDateStr = reminderDate.toISOString().split("T")[0];

      if (todayStr === reminderDateStr) {
        const dueDateFormatted = cycleDueDate.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
        });

        // Check no duplicate
        const { data: existing } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", userId)
          .eq("type", "cotisation_reminder")
          .eq("related_tontine_id", tontine.id)
          .gte("created_at", todayStr)
          .limit(1);

        if (!existing || existing.length === 0) {
          notifications.push({
            user_id: userId,
            type: "cotisation_reminder",
            title: "Cotisation à venir",
            body: `Votre cotisation de ${tontine.contribution_amount.toLocaleString("fr-FR")} FCFA pour ${tontine.name} est due dans 3 jours (le ${dueDateFormatted}).`,
            related_tontine_id: tontine.id,
          });
        }
      }

      // TRIGGER 2: Cotisation late — 1 day after due
      const lateDate = new Date(cycleDueDate);
      lateDate.setDate(lateDate.getDate() + 1);
      const lateDateStr = lateDate.toISOString().split("T")[0];

      if (todayStr === lateDateStr) {
        // Check if payment was logged for this cycle
        const { data: payments } = await supabase
          .from("tontine_payments")
          .select("id")
          .eq("tontine_id", tontine.id)
          .eq("user_id", userId)
          .eq("cycle_number", tontine.current_cycle)
          .eq("type", "contribution")
          .limit(1);

        if (!payments || payments.length === 0) {
          const { data: existing } = await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", userId)
            .eq("type", "cotisation_late")
            .eq("related_tontine_id", tontine.id)
            .gte("created_at", todayStr)
            .limit(1);

          if (!existing || existing.length === 0) {
            notifications.push({
              user_id: userId,
              type: "cotisation_late",
              title: "Cotisation en retard",
              body: `Votre cotisation pour ${tontine.name} était due hier. N'oubliez pas de l'enregistrer.`,
              related_tontine_id: tontine.id,
            });
          }
        }
      }

      // TRIGGER 3: Pot upcoming — 7 days before user's payout
      const currentUserMember = members.find((m) => m.is_current_user);
      if (currentUserMember?.payout_date) {
        const payoutDate = new Date(currentUserMember.payout_date);
        const upcomingDate = new Date(payoutDate);
        upcomingDate.setDate(upcomingDate.getDate() - 7);
        const upcomingDateStr = upcomingDate.toISOString().split("T")[0];

        if (todayStr === upcomingDateStr && !currentUserMember.has_received_pot) {
          const { data: existing } = await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", userId)
            .eq("type", "pot_upcoming")
            .eq("related_tontine_id", tontine.id)
            .gte("created_at", todayStr)
            .limit(1);

          if (!existing || existing.length === 0) {
            notifications.push({
              user_id: userId,
              type: "pot_upcoming",
              title: "Bonne nouvelle !",
              body: `Vous recevrez le pot de ${potAmount.toLocaleString("fr-FR")} FCFA de ${tontine.name} dans 7 jours !`,
              related_tontine_id: tontine.id,
            });
          }
        }
      }
    }

    // Batch insert all notifications
    if (notifications.length > 0) {
      const { error: insertErr } = await supabase
        .from("notifications")
        .insert(notifications);
      if (insertErr) throw insertErr;
    }

    return new Response(
      JSON.stringify({ generated: notifications.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
