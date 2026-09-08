import { useCallback, useEffect, useState } from "react";

export type Difficulty = "easy" | "medium" | "hard";

export type Task = {
  id: string;
  title: string;
  detail: string;
  estimateMinutes: number;
  dueHint: string;
  done: boolean;
};

export type Plan = {
  id: string;
  goal: string;
  deadline: string;
  difficulty: Difficulty;
  context?: string | undefined;
  summary: string;
  createdAt: string;
  tasks: Task[];
};

const STORAGE_KEY = "smartplanner.plans.v1";
const EVENT = "smartplanner:plans-changed";

function read(): Plan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Plan[]) : [];
  } catch {
    return [];
  }
}

function write(plans: Plan[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  window.dispatchEvent(new Event(EVENT));
}

export function makeId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function savePlan(plan: Plan) {
  write([plan, ...read().filter((p) => p.id !== plan.id)]);
}

export function deletePlan(id: string) {
  write(read().filter((p) => p.id !== id));
}

export function toggleTask(planId: string, taskId: string) {
  write(
    read().map((plan) =>
      plan.id === planId
        ? {
            ...plan,
            tasks: plan.tasks.map((task) =>
              task.id === taskId ? { ...task, done: !task.done } : task,
            ),
          }
        : plan,
    ),
  );
}

export function usePlans() {
  const [plans, setPlans] = useState<Plan[] | null>(null);

  const sync = useCallback(() => setPlans(read()), []);

  useEffect(() => {
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [sync]);

  return { plans, loading: plans === null };
}

export function planProgress(plan: Plan) {
  const total = plan.tasks.length;
  const done = plan.tasks.filter((t) => t.done).length;
  return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
}
