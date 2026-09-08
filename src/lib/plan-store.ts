import { useCallback, useEffect, useState } from "react";

export type Difficulty = "easy" | "medium" | "hard";
export type Priority = "high" | "medium" | "low";

export type Task = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  estimated_time: string;
  completed: boolean;
};

export type Plan = {
  id: string;
  goal: string;
  deadline: string;
  difficulty: Difficulty;
  context?: string | undefined;
  title: string;
  description: string;
  createdAt: string;
  tasks: Task[];
};

const STORAGE_KEY = "smartplanner.plans.v1";
const EVENT = "smartplanner:plans-changed";

const priorities: Priority[] = ["high", "medium", "low"];

function migrateTask(raw: unknown, index: number): Task {
  const t = (raw ?? {}) as Record<string, unknown>;
  const priority = typeof t["priority"] === "string" ? (t["priority"] as string) : "";
  const legacyMinutes = typeof t["estimateMinutes"] === "number" ? t["estimateMinutes"] : undefined;
  return {
    id: typeof t["id"] === "string" ? t["id"] : `task-${index}-${makeId()}`,
    title: typeof t["title"] === "string" ? t["title"] : "Untitled step",
    description:
      typeof t["description"] === "string"
        ? t["description"]
        : typeof t["detail"] === "string"
          ? (t["detail"] as string)
          : "",
    priority: (priorities as string[]).includes(priority) ? (priority as Priority) : "medium",
    estimated_time:
      typeof t["estimated_time"] === "string"
        ? t["estimated_time"]
        : legacyMinutes
          ? `${legacyMinutes} min`
          : "",
    completed:
      typeof t["completed"] === "boolean"
        ? t["completed"]
        : typeof t["done"] === "boolean"
          ? (t["done"] as boolean)
          : false,
  };
}

function migratePlan(raw: unknown): Plan {
  const p = (raw ?? {}) as Record<string, unknown>;
  const goal = typeof p["goal"] === "string" ? p["goal"] : "Untitled plan";
  return {
    id: typeof p["id"] === "string" ? p["id"] : makeId(),
    goal,
    deadline: typeof p["deadline"] === "string" ? p["deadline"] : "",
    difficulty: (["easy", "medium", "hard"] as string[]).includes(String(p["difficulty"]))
      ? (p["difficulty"] as Difficulty)
      : "medium",
    context: typeof p["context"] === "string" ? p["context"] : undefined,
    title: typeof p["title"] === "string" ? p["title"] : goal,
    description:
      typeof p["description"] === "string"
        ? p["description"]
        : typeof p["summary"] === "string"
          ? (p["summary"] as string)
          : "",
    createdAt: typeof p["createdAt"] === "string" ? p["createdAt"] : new Date().toISOString(),
    tasks: Array.isArray(p["tasks"]) ? p["tasks"].map(migrateTask) : [],
  };
}

function read(): Plan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(migratePlan) : [];
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
              task.id === taskId ? { ...task, completed: !task.completed } : task,
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
  const done = plan.tasks.filter((t) => t.completed).length;
  return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
}
