/**
 * Airtel Money Gabon SMS Parser
 * Handles 5 SMS formats: transfer_out, transfer_in, bundle, merchant_payment, bill_payment
 */

export type SmsType = "transfer_out" | "transfer_in" | "bundle" | "merchant_payment" | "bill_payment";

export interface ParsedSms {
  type: SmsType;
  amount: number;
  fees: number;
  balance: number | null;
  recipient: string | null;
  reference: string | null;
  tid: string;
  label: string;
  suggestedCategory: string;
  notes: string | null;
}

/**
 * Parse an amount string from SMS into an integer.
 * Handles: "10300F", "20000FCFA", "10000 FCFA", "34155 F", "10 000 F CFA", "310.88F"
 */
export function parseSmsAmount(raw: string): number {
  const cleaned = raw
    .replace(/\s/g, "")
    .replace(/FCFA/gi, "")
    .replace(/FCFA/gi, "")
    .replace(/F\s*CFA/gi, "")
    .replace(/F$/i, "")
    .replace(/F(?=\d)/gi, "")
    .trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num);
}

/** Extract a raw balance value (can have decimals) */
function parseBalance(raw: string): number | null {
  const cleaned = raw
    .replace(/\s/g, "")
    .replace(/FCFA/gi, "")
    .replace(/F\s*CFA/gi, "")
    .replace(/F$/i, "")
    .trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/** Extract TID from various formats */
function extractTid(text: string): string | null {
  const match = text.match(/TID\s*:\s*([A-Z0-9]+)/i);
  return match ? match[1] : null;
}

/** Auto-detect category from merchant/provider name */
function detectCategory(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("seeg")) {
    return "Électricité";
  }
  if (lower.includes("gabon telecom") || lower.includes("libertis")) {
    return "Telecom";
  }
  if (lower.includes("canal+") || lower.includes("canal plus") || lower.includes("dstv")) {
    return "Loisirs";
  }
  if (lower.includes("pharmacie") || lower.includes("hopital") || lower.includes("clinique")) {
    return "Santé";
  }
  if (lower.includes("restaurant") || lower.includes("food")) {
    return "Restaurant";
  }
  if (lower.includes("transport") || lower.includes("taxi")) {
    return "Transport";
  }
  return "Divers";
}

// FORMAT 1 - Transfer Out
const TRANSFER_OUT_PATTERN = /Vous avez envoye\s+([\d\s.,]+)\s*F(?:CFA)?\s+au\s+([\d\s]+)\s+(.+?)\.?\s*Frais\s+([\d\s.,]+)\s*F/i;

// FORMAT 2 - Bundle/Data
const BUNDLE_PATTERN = /Paiement de\s+([\d\s.,]+)\s*F\s+(.+?)\s+pour ref\s+(\S+)\s+a ete effectue avec succes\.\s*Cout:\s*([\d\s.,]+)\s*FCFA\.\s*Solde\s+([\d\s.,]+)\s*F/i;

// FORMAT 3 - Money Received
const RECEIVED_PATTERN = /Recu\s+([\d\s.,]+)\s*FCFA\s+du\s+(\S+)\.\s*Solde actuel\s+([\d\s.,]+)\s*FCFA/i;

// FORMAT 4 - Merchant Payment
const MERCHANT_PATTERN = /Paiement de\s+([\d\s.,]+)\s*F\s+(\S+)\s+pour ref\s+(\S+)\s+de\s+(.+?)\s+a ete effectue avec succes\.\s*Cout:\s*([\d\s.,]+)\s*FCFA\.\s*Solde\s+([\d\s.,]+)\s*F/i;

// FORMAT 5 - Bill Payment
const BILL_PATTERN = /Vous avez PAYE\s+([\d\s.,]+)\s*FCFA\s+a\s+(.+?)\s+en reference a\s+(\S+)/i;

export function parseSms(rawText: string): ParsedSms | null {
  const text = rawText.trim();
  const tid = extractTid(text);
  if (!tid) return null;

  // Try FORMAT 3 - Money Received (before others since it's simplest)
  const receivedMatch = text.match(RECEIVED_PATTERN);
  if (receivedMatch) {
    return {
      type: "transfer_in",
      amount: parseSmsAmount(receivedMatch[1]),
      fees: 0,
      balance: parseBalance(receivedMatch[3]),
      recipient: receivedMatch[2].trim(),
      reference: null,
      tid,
      label: `Reçu de ${receivedMatch[2].trim()}`,
      suggestedCategory: "Mobile Money",
      notes: null,
    };
  }

  // Try FORMAT 1 - Transfer Out
  const transferOutMatch = text.match(TRANSFER_OUT_PATTERN);
  if (transferOutMatch) {
    const balanceMatch = text.match(/Nouveau Solde\s+([\d\s.,]+)\s*F/i);
    return {
      type: "transfer_out",
      amount: parseSmsAmount(transferOutMatch[1]),
      fees: parseSmsAmount(transferOutMatch[4]),
      balance: balanceMatch ? parseBalance(balanceMatch[1]) : null,
      recipient: `${transferOutMatch[2].trim()} ${transferOutMatch[3].trim()}`,
      reference: null,
      tid,
      label: `Envoi à ${transferOutMatch[3].trim()}`,
      suggestedCategory: "Mobile Money",
      notes: null,
    };
  }

  // Try FORMAT 4 - Merchant Payment (before Bundle since it's more specific)
  const merchantMatch = text.match(MERCHANT_PATTERN);
  if (merchantMatch) {
    const merchantName = merchantMatch[4].trim();
    return {
      type: "merchant_payment",
      amount: parseSmsAmount(merchantMatch[1]),
      fees: parseSmsAmount(merchantMatch[5]),
      balance: parseBalance(merchantMatch[6]),
      recipient: merchantName,
      reference: merchantMatch[3].trim(),
      tid,
      label: `Paiement ${merchantName}`,
      suggestedCategory: detectCategory(merchantName),
      notes: null,
    };
  }

  // Try FORMAT 2 - Bundle/Data
  const bundleMatch = text.match(BUNDLE_PATTERN);
  if (bundleMatch) {
    return {
      type: "bundle",
      amount: parseSmsAmount(bundleMatch[1]),
      fees: parseSmsAmount(bundleMatch[4]),
      balance: parseBalance(bundleMatch[5]),
      recipient: null,
      reference: bundleMatch[3].trim(),
      tid,
      label: `Forfait ${bundleMatch[2].trim()}`,
      suggestedCategory: "Telecom",
      notes: bundleMatch[2].trim(),
    };
  }

  // Try FORMAT 5 - Bill Payment
  const billMatch = text.match(BILL_PATTERN);
  if (billMatch) {
    const provider = billMatch[2].trim();
    const balanceMatch = text.match(/Solde:\s*([\d\s.,]+)\s*FCFA/i);
    // Extract detail text between reference and TID
    const refEnd = text.indexOf(billMatch[3]) + billMatch[3].length;
    const tidStart = text.indexOf("TID:");
    const detailText = tidStart > refEnd ? text.slice(refEnd, tidStart).replace(/^[.\s]+|[.\s]+$/g, "").trim() : null;

    let category = detectCategory(provider);
    if (provider.toLowerCase().includes("seeg") && detailText) {
      if (detailText.toLowerCase().includes("kwh")) category = "Électricité";
      if (detailText.toLowerCase().includes("eau") || detailText.toLowerCase().includes("water")) category = "Logement";
    }

    return {
      type: "bill_payment",
      amount: parseSmsAmount(billMatch[1]),
      fees: 0,
      balance: balanceMatch ? parseBalance(balanceMatch[1]) : null,
      recipient: provider,
      reference: billMatch[3].trim(),
      tid,
      label: `Facture ${provider}`,
      suggestedCategory: category,
      notes: detailText || null,
    };
  }

  return null;
}

/** Parse multiple SMS separated by blank lines */
export function parseBulkSms(text: string): { parsed: ParsedSms; rawText: string }[] {
  const smsBlocks = text.split(/\n\s*\n/).filter(b => b.trim().length > 0);
  const results: { parsed: ParsedSms; rawText: string }[] = [];

  for (const block of smsBlocks) {
    const parsed = parseSms(block.trim());
    if (parsed) {
      results.push({ parsed, rawText: block.trim() });
    }
  }

  return results;
}

/** Get display label for SMS type */
export function getSmsTypeLabel(type: SmsType): string {
  switch (type) {
    case "transfer_out": return "Envoi";
    case "transfer_in": return "Réception";
    case "bundle": return "Forfait";
    case "merchant_payment": return "Paiement";
    case "bill_payment": return "Facture";
  }
}

/** Get icon name for SMS type */
export function getSmsTypeIcon(type: SmsType): string {
  switch (type) {
    case "transfer_out": return "SendHorizontal";
    case "transfer_in": return "Download";
    case "bundle": return "Wifi";
    case "merchant_payment": return "Store";
    case "bill_payment": return "Receipt";
  }
}
