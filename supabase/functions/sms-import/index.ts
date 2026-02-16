import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

// Inline SMS parser for edge function
function parseSmsAmount(raw: string): number {
  const cleaned = raw.replace(/\s/g, "").replace(/FCFA/gi, "").replace(/F\s*CFA/gi, "").replace(/F$/i, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num);
}

function parseBalance(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, "").replace(/FCFA/gi, "").replace(/F\s*CFA/gi, "").replace(/F$/i, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function extractTid(text: string): string | null {
  const match = text.match(/TID\s*:\s*([A-Z0-9.]+)/i);
  return match ? match[1].replace(/\.$/, "") : null;
}

interface ParsedSms {
  type: string;
  amount: number;
  fees: number;
  balance: number | null;
  recipient: string | null;
  reference: string | null;
  tid: string;
  label: string;
}

function parseSms(text: string): ParsedSms | null {
  const tid = extractTid(text);
  if (!tid) return null;

  // Transfer in
  const receivedMatch = text.match(/Recu\s+([\d\s.,]+)\s*FCFA\s+du\s+(\S+)\.\s*Solde actuel\s+([\d\s.,]+)\s*FCFA/i);
  if (receivedMatch) {
    return { type: "transfer_in", amount: parseSmsAmount(receivedMatch[1]), fees: 0, balance: parseBalance(receivedMatch[3]), recipient: receivedMatch[2].trim(), reference: null, tid, label: `Reçu de ${receivedMatch[2].trim()}` };
  }

  // Transfer out
  const transferOutMatch = text.match(/Vous avez envoye\s+([\d\s.,]+)\s*F(?:CFA)?\s+au\s+([\d\s]+)\s+(.+?)\.?\s*Frais\s+([\d\s.,]+)\s*F/i);
  if (transferOutMatch) {
    const balanceMatch = text.match(/Nouveau Solde\s+([\d\s.,]+)\s*F/i);
    return { type: "transfer_out", amount: parseSmsAmount(transferOutMatch[1]), fees: parseSmsAmount(transferOutMatch[4]), balance: balanceMatch ? parseBalance(balanceMatch[1]) : null, recipient: `${transferOutMatch[2].trim()} ${transferOutMatch[3].trim()}`, reference: null, tid, label: `Envoi à ${transferOutMatch[3].trim()}` };
  }

  // Merchant payment
  const merchantMatch = text.match(/Paiement de\s+([\d\s.,]+)\s*F\s+(\S+)\s+pour ref\s+(\S+)\s+de\s+(.+?)\s+a ete effectue avec succes\.\s*Cout:\s*([\d\s.,]+)\s*FCFA\.\s*Solde\s+([\d\s.,]+)\s*F/i);
  if (merchantMatch) {
    return { type: "merchant_payment", amount: parseSmsAmount(merchantMatch[1]), fees: parseSmsAmount(merchantMatch[5]), balance: parseBalance(merchantMatch[6]), recipient: merchantMatch[4].trim(), reference: merchantMatch[3].trim(), tid, label: `Paiement ${merchantMatch[4].trim()}` };
  }

  // Bundle
  const bundleMatch = text.match(/Paiement de\s+([\d\s.,]+)\s*F\s+(.+?)\s+pour ref\s+(\S+)\s+a ete effectue avec succes\.\s*Cout:\s*([\d\s.,]+)\s*FCFA\.\s*Solde\s+([\d\s.,]+)\s*F/i);
  if (bundleMatch) {
    return { type: "bundle", amount: parseSmsAmount(bundleMatch[1]), fees: parseSmsAmount(bundleMatch[4]), balance: parseBalance(bundleMatch[5]), recipient: null, reference: bundleMatch[3].trim(), tid, label: `Forfait ${bundleMatch[2].trim()}` };
  }

  // Bill payment
  const billMatch = text.match(/Vous avez PAYE\s+([\d\s.,]+)\s*FCFA\s+a\s+(.+?)\s+en reference a\s+(\S+)/i);
  if (billMatch) {
    const balanceMatch = text.match(/Solde:\s*([\d\s.,]+)\s*FCFA/i);
    return { type: "bill_payment", amount: parseSmsAmount(billMatch[1]), fees: 0, balance: balanceMatch ? parseBalance(balanceMatch[1]) : null, recipient: billMatch[2].trim(), reference: billMatch[3].trim(), tid, label: `Facture ${billMatch[2].trim()}` };
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, sms_text, source } = await req.json();
    if (!user_id || !sms_text) {
      return new Response(JSON.stringify({ error: "Missing user_id or sms_text" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing x-api-key header" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify API key
    const { data: settings, error: settingsError } = await supabase
      .from("sms_settings")
      .select("api_key, enabled, default_payment_method_id")
      .eq("user_id", user_id)
      .maybeSingle();

    if (settingsError || !settings || settings.api_key !== apiKey) {
      return new Response(JSON.stringify({ error: "Invalid API key" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!settings.enabled) {
      return new Response(JSON.stringify({ error: "SMS import disabled" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const parsed = parseSms(sms_text);
    if (!parsed) {
      return new Response(JSON.stringify({ error: "Unrecognized SMS format" }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check duplicate
    const { count } = await supabase
      .from("sms_imports")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user_id)
      .eq("transaction_id", parsed.tid);

    if ((count ?? 0) > 0) {
      return new Response(JSON.stringify({ success: true, parsed, status: "duplicate" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Create sms_import with pending_review
    const { error: insertError } = await supabase.from("sms_imports").insert([{
      user_id,
      raw_text: sms_text,
      transaction_id: parsed.tid,
      parsed_type: parsed.type,
      parsed_amount: parsed.amount,
      parsed_fees: parsed.fees,
      parsed_balance: parsed.balance,
      parsed_recipient: parsed.recipient,
      parsed_reference: parsed.reference,
      status: "pending_review",
    }]);

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true, parsed, status: "pending_review" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
