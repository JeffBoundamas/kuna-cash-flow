import { describe, it, expect } from "vitest";
import { parseSms, parseSmsAmount, parseBulkSms } from "@/lib/sms-parser";

describe("SMS Parser", () => {
  describe("parseSmsAmount", () => {
    it("parses 10300F", () => expect(parseSmsAmount("10300F")).toBe(10300));
    it("parses 20000FCFA", () => expect(parseSmsAmount("20000FCFA")).toBe(20000));
    it("parses 10000 FCFA", () => expect(parseSmsAmount("10000 FCFA")).toBe(10000));
    it("parses 34155 F", () => expect(parseSmsAmount("34155 F")).toBe(34155));
    it("parses 310.88F to 311", () => expect(parseSmsAmount("310.88F")).toBe(311));
    it("parses 2000 F", () => expect(parseSmsAmount("2000 F")).toBe(2000));
  });

  describe("parseSms", () => {
    it("parses transfer out", () => {
      const sms = "Vous avez envoye 10300F au 077123456 Jean Dupont.Frais 200F. Nouveau Solde 45000F.TID:ABC123456.";
      const result = parseSms(sms);
      expect(result).not.toBeNull();
      expect(result!.type).toBe("transfer_out");
      expect(result!.amount).toBe(10300);
      expect(result!.fees).toBe(200);
      expect(result!.balance).toBe(45000);
      expect(result!.tid).toBe("ABC123456");
    });

    it("parses transfer in", () => {
      const sms = "Recu 20000FCFA du 077654321. Solde actuel 65000FCFA. TID:XYZ789. Promo GIMACPAY blabla";
      const result = parseSms(sms);
      expect(result).not.toBeNull();
      expect(result!.type).toBe("transfer_in");
      expect(result!.amount).toBe(20000);
      expect(result!.balance).toBe(65000);
      expect(result!.tid).toBe("XYZ789");
    });

    it("parses bundle purchase", () => {
      const sms = "Paiement de 2000 F BUNDLE DATA pour ref REF001 a ete effectue avec succes. Cout: 0 FCFA. Solde 43000F. TID: BND001.";
      const result = parseSms(sms);
      expect(result).not.toBeNull();
      expect(result!.type).toBe("bundle");
      expect(result!.amount).toBe(2000);
      expect(result!.tid).toBe("BND001");
    });

    it("parses bill payment", () => {
      const sms = "Vous avez PAYE 34155 FCFA a SEEG en reference a 123456789...Consommation 150 kWh TVA 2000...TID: BILL001...Solde: 10000 FCFA.";
      const result = parseSms(sms);
      expect(result).not.toBeNull();
      expect(result!.type).toBe("bill_payment");
      expect(result!.amount).toBe(34155);
      expect(result!.tid).toBe("BILL001");
    });

    it("returns null for unrecognized SMS", () => {
      expect(parseSms("Hello, how are you?")).toBeNull();
    });
  });

  describe("parseBulkSms", () => {
    it("parses multiple SMS separated by blank lines", () => {
      const bulk = `Recu 20000FCFA du 077654321. Solde actuel 65000FCFA. TID:A1.

Vous avez envoye 10300F au 077123456 Jean.Frais 200F. Nouveau Solde 45000F.TID:A2.`;
      const results = parseBulkSms(bulk);
      expect(results).toHaveLength(2);
      expect(results[0].parsed.type).toBe("transfer_in");
      expect(results[1].parsed.type).toBe("transfer_out");
    });
  });
});
