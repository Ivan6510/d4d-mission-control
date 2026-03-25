"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";
import { getDeals } from "./store";
import type { Deal } from "./types";

/**
 * Hook that fetches deals and subscribes to Supabase Realtime
 * for live cross-device sync. Falls back gracefully when Supabase
 * is unavailable (uses store.ts which handles the fallback).
 */
export function useRealtimeDeals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const fetchDeals = useCallback(async () => {
    try {
      const data = await getDeals();
      if (mountedRef.current) setDeals(data);
    } catch {
      // store.ts handles fallback
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchDeals();
  }, [fetchDeals]);

  useEffect(() => {
    mountedRef.current = true;

    // Initial fetch
    fetchDeals().finally(() => {
      if (mountedRef.current) setLoading(false);
    });

    // Subscribe to Supabase Realtime on the deals table
    if (!supabase) return;

    const channel = supabase
      .channel("deals-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deals" },
        () => {
          // Refetch all deals on any change
          fetchDeals();
        }
      )
      .subscribe();

    return () => {
      mountedRef.current = false;
      channel.unsubscribe();
    };
  }, [fetchDeals]);

  return { deals, setDeals, loading, refetch };
}
