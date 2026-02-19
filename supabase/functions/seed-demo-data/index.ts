import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SeedConfig {
  paymentMethods: { name: string; icon: string; category: string; color: string; initial_balance: number; method_type: string; allow_negative_balance: boolean }[];
  transactions: { categoryName: string; amount: number; label: string; date: string; pmIndex: number }[];
  budgets: { categoryName: string; amountLimit: number }[];
  goals: { name: string; targetAmount: number; currentAmount: number; deadline: string; icon: string; isEmergencyFund: boolean }[];
  fixedCharges: { name: string; amount: number; beneficiary: string; dueDay: number; categoryName: string }[];
}

const now = new Date();
const y = now.getFullYear();
const m = now.getMonth() + 1;
const d = (day: number) => `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
const prevMonth = (day: number) => {
  const pm = m === 1 ? 12 : m - 1;
  const py = m === 1 ? y - 1 : y;
  return `${py}-${String(pm).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

const PERSONAS: Record<string, { label: string; config: SeedConfig }> = {
  etudiant: {
    label: "Étudiant",
    config: {
      paymentMethods: [
        { name: "Espèces", icon: "Banknote", category: "Cash", color: "#22C55E", initial_balance: 8000, method_type: "cash", allow_negative_balance: false },
        { name: "MTN MoMo", icon: "Smartphone", category: "Mobile Money", color: "#F59E0B", initial_balance: 15000, method_type: "mobile_money", allow_negative_balance: false },
      ],
      transactions: [
        { categoryName: "Salaire", amount: 50000, label: "Bourse mensuelle", date: d(3), pmIndex: 1 },
        { categoryName: "Salaire", amount: 25000, label: "Cours particuliers", date: d(10), pmIndex: 0 },
        { categoryName: "Alimentation", amount: -8000, label: "Repas campus", date: d(5), pmIndex: 0 },
        { categoryName: "Alimentation", amount: -6500, label: "Provisions semaine", date: d(12), pmIndex: 1 },
        { categoryName: "Transport", amount: -4000, label: "Moto-taxi", date: d(6), pmIndex: 0 },
        { categoryName: "Transport", amount: -3500, label: "Bus + moto", date: d(13), pmIndex: 0 },
        { categoryName: "Éducation", amount: -12000, label: "Photocopies cours", date: d(4), pmIndex: 1 },
        { categoryName: "Loisirs", amount: -3000, label: "Ciné entre amis", date: d(8), pmIndex: 0 },
        { categoryName: "Mobile Money", amount: -2000, label: "Forfait internet", date: d(2), pmIndex: 1 },
        // Previous month
        { categoryName: "Salaire", amount: 50000, label: "Bourse janvier", date: prevMonth(3), pmIndex: 1 },
        { categoryName: "Alimentation", amount: -12000, label: "Nourriture mois", date: prevMonth(7), pmIndex: 0 },
        { categoryName: "Transport", amount: -5000, label: "Déplacements", date: prevMonth(10), pmIndex: 0 },
        { categoryName: "Éducation", amount: -8000, label: "Livres", date: prevMonth(5), pmIndex: 1 },
      ],
      budgets: [
        { categoryName: "Alimentation", amountLimit: 20000 },
        { categoryName: "Transport", amountLimit: 10000 },
        { categoryName: "Éducation", amountLimit: 15000 },
        { categoryName: "Loisirs", amountLimit: 5000 },
        { categoryName: "Mobile Money", amountLimit: 3000 },
      ],
      goals: [
        { name: "Laptop neuf", targetAmount: 250000, currentAmount: 45000, deadline: `${y}-09-30`, icon: "laptop", isEmergencyFund: false },
      ],
      fixedCharges: [
        { name: "Forfait Internet", amount: 2000, beneficiary: "MTN", dueDay: 1, categoryName: "Mobile Money" },
      ],
    },
  },

  salarie: {
    label: "Salarié moyen",
    config: {
      paymentMethods: [
        { name: "Espèces", icon: "Banknote", category: "Cash", color: "#22C55E", initial_balance: 25000, method_type: "cash", allow_negative_balance: false },
        { name: "BICEC Courant", icon: "Building2", category: "Bank", color: "#3B82F6", initial_balance: 180000, method_type: "bank_account", allow_negative_balance: true },
        { name: "MTN MoMo", icon: "Smartphone", category: "Mobile Money", color: "#F59E0B", initial_balance: 42000, method_type: "mobile_money", allow_negative_balance: false },
        { name: "Orange Money", icon: "Smartphone", category: "Mobile Money", color: "#F97316", initial_balance: 18000, method_type: "mobile_money", allow_negative_balance: false },
      ],
      transactions: [
        { categoryName: "Salaire", amount: 320000, label: "Salaire Février", date: d(5), pmIndex: 1 },
        { categoryName: "Freelance", amount: 45000, label: "Dépannage informatique", date: d(12), pmIndex: 2 },
        { categoryName: "Logement", amount: -75000, label: "Loyer studio", date: d(1), pmIndex: 1 },
        { categoryName: "Alimentation", amount: -35000, label: "Marché semaine 1", date: d(7), pmIndex: 0 },
        { categoryName: "Alimentation", amount: -28000, label: "Marché semaine 2", date: d(14), pmIndex: 2 },
        { categoryName: "Transport", amount: -8000, label: "Taxi bureau", date: d(6), pmIndex: 0 },
        { categoryName: "Transport", amount: -6000, label: "Moto + bus", date: d(13), pmIndex: 0 },
        { categoryName: "Électricité", amount: -12000, label: "Facture ENEO", date: d(8), pmIndex: 3 },
        { categoryName: "Restaurant", amount: -7500, label: "Déjeuner Le Safoutier", date: d(9), pmIndex: 0 },
        { categoryName: "Charge Familiale", amount: -20000, label: "Aide petit frère", date: d(10), pmIndex: 2 },
        { categoryName: "Épargne", amount: -50000, label: "Virement épargne", date: d(6), pmIndex: 1 },
        { categoryName: "Santé", amount: -8000, label: "Pharmacie", date: d(11), pmIndex: 0 },
        { categoryName: "Loisirs", amount: -5000, label: "Sortie week-end", date: d(8), pmIndex: 0 },
        { categoryName: "Mobile Money", amount: -3500, label: "Forfait 4G", date: d(2), pmIndex: 2 },
        // Previous month
        { categoryName: "Salaire", amount: 320000, label: "Salaire Janvier", date: prevMonth(5), pmIndex: 1 },
        { categoryName: "Logement", amount: -75000, label: "Loyer janvier", date: prevMonth(1), pmIndex: 1 },
        { categoryName: "Alimentation", amount: -55000, label: "Courses janvier", date: prevMonth(8), pmIndex: 0 },
        { categoryName: "Transport", amount: -15000, label: "Transports janvier", date: prevMonth(10), pmIndex: 0 },
        { categoryName: "Épargne", amount: -50000, label: "Épargne janvier", date: prevMonth(6), pmIndex: 1 },
      ],
      budgets: [
        { categoryName: "Logement", amountLimit: 75000 },
        { categoryName: "Alimentation", amountLimit: 60000 },
        { categoryName: "Transport", amountLimit: 20000 },
        { categoryName: "Électricité", amountLimit: 15000 },
        { categoryName: "Restaurant", amountLimit: 12000 },
        { categoryName: "Charge Familiale", amountLimit: 25000 },
        { categoryName: "Épargne", amountLimit: 60000 },
        { categoryName: "Loisirs", amountLimit: 8000 },
        { categoryName: "Santé", amountLimit: 10000 },
      ],
      goals: [
        { name: "Fonds d'urgence", targetAmount: 1000000, currentAmount: 280000, deadline: `${y}-12-31`, icon: "shield", isEmergencyFund: true },
        { name: "Formation Cloud AWS", targetAmount: 200000, currentAmount: 120000, deadline: `${y}-06-30`, icon: "graduation-cap", isEmergencyFund: false },
      ],
      fixedCharges: [
        { name: "Loyer", amount: 75000, beneficiary: "Propriétaire", dueDay: 1, categoryName: "Logement" },
        { name: "Facture ENEO", amount: 12000, beneficiary: "ENEO", dueDay: 8, categoryName: "Électricité" },
        { name: "Forfait 4G", amount: 3500, beneficiary: "MTN", dueDay: 1, categoryName: "Mobile Money" },
      ],
    },
  },

  commercant: {
    label: "Commerçant",
    config: {
      paymentMethods: [
        { name: "Caisse boutique", icon: "Banknote", category: "Cash", color: "#22C55E", initial_balance: 95000, method_type: "cash", allow_negative_balance: false },
        { name: "Afriland Compte Pro", icon: "Building2", category: "Bank", color: "#3B82F6", initial_balance: 520000, method_type: "bank_account", allow_negative_balance: true },
        { name: "MTN MoMo Pro", icon: "Smartphone", category: "Mobile Money", color: "#F59E0B", initial_balance: 185000, method_type: "mobile_money", allow_negative_balance: false },
        { name: "Orange Money", icon: "Smartphone", category: "Mobile Money", color: "#F97316", initial_balance: 72000, method_type: "mobile_money", allow_negative_balance: false },
      ],
      transactions: [
        { categoryName: "Salaire", amount: 450000, label: "Ventes semaine 1", date: d(7), pmIndex: 0 },
        { categoryName: "Salaire", amount: 380000, label: "Ventes semaine 2", date: d(14), pmIndex: 0 },
        { categoryName: "Freelance", amount: 120000, label: "Commande spéciale client", date: d(10), pmIndex: 2 },
        { categoryName: "Freelance", amount: 85000, label: "Livraison en gros", date: d(13), pmIndex: 1 },
        { categoryName: "Logement", amount: -120000, label: "Loyer boutique", date: d(1), pmIndex: 1 },
        { categoryName: "Alimentation", amount: -45000, label: "Courses famille", date: d(8), pmIndex: 0 },
        { categoryName: "Transport", amount: -35000, label: "Livraisons + déplacements", date: d(6), pmIndex: 0 },
        { categoryName: "Divers", amount: -280000, label: "Réapprovisionnement stock", date: d(3), pmIndex: 1 },
        { categoryName: "Divers", amount: -150000, label: "Stock complémentaire", date: d(11), pmIndex: 2 },
        { categoryName: "Électricité", amount: -18000, label: "Facture boutique + maison", date: d(9), pmIndex: 3 },
        { categoryName: "Charge Familiale", amount: -30000, label: "Scolarité enfants", date: d(5), pmIndex: 1 },
        { categoryName: "Épargne", amount: -100000, label: "Épargne mensuelle", date: d(7), pmIndex: 1 },
        { categoryName: "Restaurant", amount: -12000, label: "Repas clients", date: d(12), pmIndex: 0 },
        { categoryName: "Mobile Money", amount: -5000, label: "Forfaits téléphone", date: d(2), pmIndex: 2 },
        { categoryName: "Santé", amount: -15000, label: "Consultation + médicaments", date: d(10), pmIndex: 0 },
        // Previous month
        { categoryName: "Salaire", amount: 780000, label: "Ventes janvier", date: prevMonth(15), pmIndex: 0 },
        { categoryName: "Logement", amount: -120000, label: "Loyer boutique jan", date: prevMonth(1), pmIndex: 1 },
        { categoryName: "Divers", amount: -350000, label: "Stock janvier", date: prevMonth(5), pmIndex: 1 },
        { categoryName: "Épargne", amount: -100000, label: "Épargne janvier", date: prevMonth(7), pmIndex: 1 },
        { categoryName: "Charge Familiale", amount: -30000, label: "Scolarité jan", date: prevMonth(5), pmIndex: 1 },
      ],
      budgets: [
        { categoryName: "Logement", amountLimit: 120000 },
        { categoryName: "Alimentation", amountLimit: 60000 },
        { categoryName: "Transport", amountLimit: 40000 },
        { categoryName: "Divers", amountLimit: 500000 },
        { categoryName: "Électricité", amountLimit: 20000 },
        { categoryName: "Charge Familiale", amountLimit: 50000 },
        { categoryName: "Épargne", amountLimit: 120000 },
        { categoryName: "Restaurant", amountLimit: 15000 },
        { categoryName: "Santé", amountLimit: 20000 },
      ],
      goals: [
        { name: "Deuxième boutique", targetAmount: 5000000, currentAmount: 1200000, deadline: `${y + 1}-06-30`, icon: "store", isEmergencyFund: false },
        { name: "Fonds d'urgence", targetAmount: 2000000, currentAmount: 650000, deadline: `${y}-12-31`, icon: "shield", isEmergencyFund: true },
        { name: "Véhicule livraison", targetAmount: 3000000, currentAmount: 400000, deadline: `${y + 1}-12-31`, icon: "truck", isEmergencyFund: false },
      ],
      fixedCharges: [
        { name: "Loyer boutique", amount: 120000, beneficiary: "Propriétaire", dueDay: 1, categoryName: "Logement" },
        { name: "Facture ENEO", amount: 18000, beneficiary: "ENEO", dueDay: 8, categoryName: "Électricité" },
        { name: "Scolarité enfants", amount: 30000, beneficiary: "École", dueDay: 5, categoryName: "Charge Familiale" },
        { name: "Forfaits téléphone", amount: 5000, beneficiary: "MTN/Orange", dueDay: 1, categoryName: "Mobile Money" },
      ],
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { persona } = await req.json();
    const personaData = PERSONAS[persona];
    if (!personaData) {
      return new Response(
        JSON.stringify({ error: `Persona inconnu: ${persona}. Valides: ${Object.keys(PERSONAS).join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config = personaData.config;
    const userId = user.id;

    // Update profile name
    await supabase.from("profiles").update({ full_name: personaData.label }).eq("user_id", userId);

    // Delete existing user data (clean slate)
    await supabase.from("transactions").delete().eq("user_id", userId);
    await supabase.from("budgets").delete().eq("user_id", userId);
    await supabase.from("goal_contributions").delete().eq("user_id", userId);
    await supabase.from("goals").delete().eq("user_id", userId);
    await supabase.from("fixed_charges").delete().eq("user_id", userId);
    await supabase.from("payment_methods").delete().eq("user_id", userId);

    // 1. Insert payment methods
    const { data: pmData } = await supabase.from("payment_methods").insert(
      config.paymentMethods.map((pm, i) => ({
        user_id: userId,
        name: pm.name,
        icon: pm.icon,
        category: pm.category,
        color: pm.color,
        initial_balance: pm.initial_balance,
        method_type: pm.method_type,
        allow_negative_balance: pm.allow_negative_balance,
        sort_order: i + 1,
      }))
    ).select("id");

    const pmIds = pmData?.map((p) => p.id) || [];

    // 2. Get categories (seeded by trigger)
    const { data: cats } = await supabase.from("categories").select("id, name").eq("user_id", userId);
    const catMap = new Map((cats || []).map((c) => [c.name, c.id]));

    // 3. Insert transactions
    const txRows = config.transactions
      .filter((tx) => catMap.has(tx.categoryName) && pmIds[tx.pmIndex])
      .map((tx) => ({
        user_id: userId,
        category_id: catMap.get(tx.categoryName)!,
        amount: tx.amount,
        label: tx.label,
        date: tx.date,
        payment_method_id: pmIds[tx.pmIndex],
        status: "Realized" as const,
      }));
    if (txRows.length > 0) {
      await supabase.from("transactions").insert(txRows);
    }

    // 4. Insert budgets
    const budgetRows = config.budgets
      .filter((b) => catMap.has(b.categoryName))
      .map((b) => ({
        user_id: userId,
        category_id: catMap.get(b.categoryName)!,
        month: m,
        year: y,
        amount_limit: b.amountLimit,
      }));
    if (budgetRows.length > 0) {
      await supabase.from("budgets").insert(budgetRows);
    }

    // 5. Insert goals
    if (config.goals.length > 0) {
      await supabase.from("goals").insert(
        config.goals.map((g) => ({
          user_id: userId,
          name: g.name,
          target_amount: g.targetAmount,
          current_amount: g.currentAmount,
          deadline: g.deadline,
          icon: g.icon,
          is_emergency_fund: g.isEmergencyFund,
        }))
      );
    }

    // 6. Insert fixed charges
    const fcRows = config.fixedCharges
      .filter((fc) => catMap.has(fc.categoryName))
      .map((fc) => ({
        user_id: userId,
        name: fc.name,
        amount: fc.amount,
        beneficiary: fc.beneficiary,
        due_day: fc.dueDay,
        category_id: catMap.get(fc.categoryName)!,
        payment_method_id: pmIds[0],
      }));
    if (fcRows.length > 0) {
      await supabase.from("fixed_charges").insert(fcRows);
    }

    return new Response(
      JSON.stringify({
        success: true,
        persona: personaData.label,
        summary: {
          payment_methods: pmIds.length,
          transactions: txRows.length,
          budgets: budgetRows.length,
          goals: config.goals.length,
          fixed_charges: fcRows.length,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
