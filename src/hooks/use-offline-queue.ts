import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

const QUEUE_KEY = "kuna_offline_queue";

interface QueuedTransaction {
  account_id: string;
  category_id: string;
  amount: number;
  label: string;
  date: string;
  sms_reference?: string;
  user_id: string;
}

const getQueue = (): QueuedTransaction[] => {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
};

const setQueue = (queue: QueuedTransaction[]) => {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

export const enqueueTransaction = (tx: QueuedTransaction) => {
  const queue = getQueue();
  queue.push(tx);
  setQueue(queue);
};

export const useOfflineQueue = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const syncQueue = useCallback(async () => {
    if (!user) return;
    const queue = getQueue();
    if (queue.length === 0) return;

    const synced: number[] = [];
    for (let i = 0; i < queue.length; i++) {
      const tx = queue[i];
      const { error } = await supabase.from("transactions").insert([tx]);
      if (!error) {
        // Update account balance
        const { data: acc } = await supabase
          .from("accounts")
          .select("balance")
          .eq("id", tx.account_id)
          .maybeSingle();
        if (acc) {
          await supabase
            .from("accounts")
            .update({ balance: acc.balance + tx.amount })
            .eq("id", tx.account_id);
        }
        synced.push(i);
      }
    }

    if (synced.length > 0) {
      const remaining = queue.filter((_, i) => !synced.includes(i));
      setQueue(remaining);
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["transactions-all"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      toast({
        title: `${synced.length} transaction(s) synchronisée(s) ✓`,
        description: "Les transactions hors-ligne ont été envoyées.",
      });
    }
  }, [user, qc]);

  // Sync when coming back online
  useEffect(() => {
    const handler = () => syncQueue();
    window.addEventListener("online", handler);
    // Also try on mount
    if (navigator.onLine) syncQueue();
    return () => window.removeEventListener("online", handler);
  }, [syncQueue]);

  return { syncQueue, queueLength: getQueue().length };
};
