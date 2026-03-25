"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import * as store from "./store";
import type {
  Deal,
  Lead,
  RehabItem,
  Draw,
  ActivityLog,
  Task,
  DealNote,
} from "./types";

// ---------------------------------------------------------------------------
// Generic query hook
// ---------------------------------------------------------------------------

interface QueryResult<T> {
  data: T;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

function useQuery<T>(fetcher: () => Promise<T>, fallback: T): QueryResult<T> {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refetch = useCallback(async () => {
    setError(null);
    try {
      const result = await fetcherRef.current();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

// ---------------------------------------------------------------------------
// Deals
// ---------------------------------------------------------------------------

export function useDeals() {
  const { data, loading, error, refetch } = useQuery(() => store.getDeals(), []);

  const createDeal = useCallback(
    async (d: Partial<Deal>) => {
      const result = await store.createDeal(d);
      await refetch();
      return result;
    },
    [refetch]
  );

  const updateDeal = useCallback(
    async (id: string, updates: Partial<Deal>) => {
      const result = await store.updateDeal(id, updates);
      await refetch();
      return result;
    },
    [refetch]
  );

  return { data, loading, error, refetch, createDeal, updateDeal };
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

export function useLeads() {
  const { data, loading, error, refetch } = useQuery(() => store.getLeads(), []);

  const createLead = useCallback(
    async (d: Partial<Lead>) => {
      const result = await store.createLead(d);
      await refetch();
      return result;
    },
    [refetch]
  );

  const updateLead = useCallback(
    async (id: string, updates: Partial<Lead>) => {
      const result = await store.updateLead(id, updates);
      await refetch();
      return result;
    },
    [refetch]
  );

  return { data, loading, error, refetch, createLead, updateLead };
}

// ---------------------------------------------------------------------------
// Rehab Items (scoped to a deal)
// ---------------------------------------------------------------------------

export function useRehabItems(dealId: string | null) {
  const fetcher = useCallback(
    () => (dealId ? store.getRehabItems(dealId) : Promise.resolve([])),
    [dealId]
  );
  const { data, loading, error, refetch } = useQuery(fetcher, []);

  // Re-fetch when dealId changes
  useEffect(() => {
    refetch();
  }, [dealId, refetch]);

  const createRehabItem = useCallback(
    async (d: Partial<RehabItem>) => {
      const result = await store.createRehabItem(d);
      await refetch();
      return result;
    },
    [refetch]
  );

  const updateRehabItem = useCallback(
    async (id: string, updates: Partial<RehabItem>) => {
      const result = await store.updateRehabItem(id, updates);
      await refetch();
      return result;
    },
    [refetch]
  );

  return { data, loading, error, refetch, createRehabItem, updateRehabItem };
}

// ---------------------------------------------------------------------------
// Draws (scoped to a deal)
// ---------------------------------------------------------------------------

export function useDraws(dealId: string | null) {
  const fetcher = useCallback(
    () => (dealId ? store.getDraws(dealId) : Promise.resolve([])),
    [dealId]
  );
  const { data, loading, error, refetch } = useQuery(fetcher, []);

  useEffect(() => {
    refetch();
  }, [dealId, refetch]);

  const createDraw = useCallback(
    async (d: Partial<Draw>) => {
      const result = await store.createDraw(d);
      await refetch();
      return result;
    },
    [refetch]
  );

  const updateDraw = useCallback(
    async (id: string, updates: Partial<Draw>) => {
      const result = await store.updateDraw(id, updates);
      await refetch();
      return result;
    },
    [refetch]
  );

  return { data, loading, error, refetch, createDraw, updateDraw };
}

// ---------------------------------------------------------------------------
// Activities (paginated)
// ---------------------------------------------------------------------------

export function useActivities(offset = 0, limit = 30) {
  const fetcher = useCallback(
    () => store.getActivities(offset, limit),
    [offset, limit]
  );
  const { data, loading, error, refetch } = useQuery(fetcher, []);

  useEffect(() => {
    refetch();
  }, [offset, limit, refetch]);

  const createActivity = useCallback(
    async (d: Partial<ActivityLog>) => {
      const result = await store.createActivity(d);
      await refetch();
      return result;
    },
    [refetch]
  );

  const getCount = useCallback(() => store.getActivityCount(), []);

  return { data, loading, error, refetch, createActivity, getCount };
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export function useTasks() {
  const { data, loading, error, refetch } = useQuery(() => store.getTasks(), []);

  const createTask = useCallback(
    async (d: Partial<Task>) => {
      const result = await store.createTask(d);
      await refetch();
      return result;
    },
    [refetch]
  );

  const updateTask = useCallback(
    async (id: string, updates: Partial<Task>) => {
      const result = await store.updateTask(id, updates);
      await refetch();
      return result;
    },
    [refetch]
  );

  return { data, loading, error, refetch, createTask, updateTask };
}

// ---------------------------------------------------------------------------
// Notes (scoped to a deal)
// ---------------------------------------------------------------------------

export function useNotes(dealId: string | null) {
  const fetcher = useCallback(
    () => (dealId ? store.getNotes(dealId) : Promise.resolve([])),
    [dealId]
  );
  const { data, loading, error, refetch } = useQuery(fetcher, []);

  useEffect(() => {
    refetch();
  }, [dealId, refetch]);

  const createNote = useCallback(
    async (d: Partial<DealNote>) => {
      const result = await store.createNote(d);
      await refetch();
      return result;
    },
    [refetch]
  );

  return { data, loading, error, refetch, createNote };
}

// ---------------------------------------------------------------------------
// Re-export store mutations for pages that only need write (e.g. calculator)
// ---------------------------------------------------------------------------
export const createDeal = store.createDeal;
export const createActivity = store.createActivity;
export const createNote = store.createNote;
export const seedIfNeeded = store.seedIfNeeded;
export const getActivities = store.getActivities;
export const getActivityCount = store.getActivityCount;
