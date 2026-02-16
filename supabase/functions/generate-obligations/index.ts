import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Get all active fixed charges with auto_generate_obligation = true
    const { data: charges, error: chargesErr } = await supabase
      .from("fixed_charges")
      .select("*")
      .eq("is_active", true)
      .eq("auto_generate_obligation", true);

    if (chargesErr) throw chargesErr;

    let created = 0;

    for (const charge of charges ?? []) {
      // Check if end_date has passed
      if (charge.end_date && new Date(charge.end_date) < now) continue;
      // Check if start_date is in the future
      if (new Date(charge.start_date) > now) continue;

      // Calculate due date for current period
      let dueDate: Date;
      if (charge.frequency === "monthly") {
        const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
        const day = Math.min(charge.due_day, lastDay);
        dueDate = new Date(currentYear, currentMonth, day);
      } else if (charge.frequency === "quarterly") {
        const quarterMonth = Math.floor(currentMonth / 3) * 3;
        const lastDay = new Date(currentYear, quarterMonth + 1, 0).getDate();
        const day = Math.min(charge.due_day, lastDay);
        dueDate = new Date(currentYear, quarterMonth, day);
      } else {
        // yearly - use start month
        const startMonth = new Date(charge.start_date).getMonth();
        const lastDay = new Date(currentYear, startMonth + 1, 0).getDate();
        const day = Math.min(charge.due_day, lastDay);
        dueDate = new Date(currentYear, startMonth, day);
      }

      const dueDateStr = dueDate.toISOString().slice(0, 10);

      // Check if obligation already exists for this charge and period
      const { data: existing } = await supabase
        .from("obligations")
        .select("id")
        .eq("user_id", charge.user_id)
        .eq("linked_fixed_charge_id", charge.id)
        .eq("due_date", dueDateStr)
        .limit(1);

      if (existing && existing.length > 0) continue;

      // Create obligation
      const { error: insertErr } = await supabase.from("obligations").insert([{
        user_id: charge.user_id,
        type: "engagement",
        person_name: charge.beneficiary || charge.name,
        description: charge.name,
        total_amount: charge.amount,
        remaining_amount: charge.amount,
        due_date: dueDateStr,
        confidence: "certain",
        status: "active",
        linked_fixed_charge_id: charge.id,
      }]);

      if (!insertErr) created++;
    }

    // Also handle savings goals with auto_contribute
    const { data: goals, error: goalsErr } = await supabase
      .from("goals")
      .select("*")
      .eq("auto_contribute", true)
      .gt("monthly_contribution", 0);

    if (!goalsErr && goals) {
      for (const goal of goals) {
        // Check if deadline has passed
        if (new Date(goal.deadline) < now) continue;
        // Check if goal is already fully funded
        if (goal.current_amount >= goal.target_amount) continue;

        const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
        const day = Math.min(goal.contribute_day || 1, lastDay);
        const dueDate = new Date(currentYear, currentMonth, day);
        const dueDateStr = dueDate.toISOString().slice(0, 10);

        // Check if obligation already exists
        const { data: existing } = await supabase
          .from("obligations")
          .select("id")
          .eq("user_id", goal.user_id)
          .eq("linked_savings_goal_id", goal.id)
          .eq("due_date", dueDateStr)
          .limit(1);

        if (existing && existing.length > 0) continue;

        const { error: insertErr } = await supabase.from("obligations").insert([{
          user_id: goal.user_id,
          type: "engagement",
          person_name: `Épargne — ${goal.name}`,
          description: `Versement mensuel objectif "${goal.name}"`,
          total_amount: goal.monthly_contribution,
          remaining_amount: goal.monthly_contribution,
          due_date: dueDateStr,
          confidence: "certain",
          status: "active",
          linked_savings_goal_id: goal.id,
        }]);

        if (!insertErr) created++;
      }
    }

    return new Response(JSON.stringify({ ok: true, created }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
