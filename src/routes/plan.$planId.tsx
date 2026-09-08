import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Clock, PartyPopper } from "lucide-react";

import { DifficultyBadge } from "@/components/plan-bits";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { planProgress, toggleTask, usePlans } from "@/lib/plan-store";

export const Route = createFileRoute("/plan/$planId")({
  head: () => ({
    meta: [
      { title: "Plan details — Momentum AI Planner" },
      {
        name: "description",
        content:
          "Work through your AI-generated steps, tick them off and watch your progress bar fill up.",
      },
      { property: "og:title", content: "Plan details — Momentum AI Planner" },
      {
        property: "og:description",
        content: "Tick off AI-generated steps and track progress toward your deadline.",
      },
    ],
  }),
  component: PlanDetail,
});

function PlanDetail() {
  const { planId } = Route.useParams();
  const { plans, loading } = usePlans();
  const plan = plans?.find((p) => p.id === planId);

  if (loading) {
    return (
      <Shell>
        <Skeleton className="h-10 w-2/3 bg-card" />
        <Skeleton className="mt-4 h-24 w-full bg-card" />
        <Skeleton className="mt-4 h-64 w-full bg-card" />
      </Shell>
    );
  }

  if (!plan) {
    return (
      <Shell>
        <div className="rounded-2xl border border-dashed border-border/80 bg-card/50 p-10 text-center">
          <p className="font-display text-lg font-semibold">Plan not found</p>
          <p className="mt-2 text-sm text-muted-foreground">
            It may have been deleted, or saved in a different browser.
          </p>
          <Button asChild className="mt-5">
            <Link to="/">Back to dashboard</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  const { done, total, percent } = planProgress(plan);
  const totalMinutes = plan.tasks.reduce((sum, task) => sum + task.estimateMinutes, 0);

  return (
    <Shell>
      <h1 className="text-3xl font-semibold sm:text-4xl">{plan.goal}</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">{plan.summary}</p>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="size-3.5" aria-hidden />
          {plan.deadline}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" aria-hidden />
          {Math.round(totalMinutes / 60)}h of focused work
        </span>
        <DifficultyBadge difficulty={plan.difficulty} />
      </div>

      <div className="mt-6 rounded-2xl border border-border/70 bg-card p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {done} of {total} steps complete
          </span>
          <span className="font-display text-lg font-semibold text-primary">{percent}%</span>
        </div>
        <Progress value={percent} className="mt-3 h-2.5 bg-secondary" />
        {percent === 100 ? (
          <p className="mt-3 inline-flex items-center gap-2 text-sm text-primary">
            <PartyPopper className="size-4" aria-hidden />
            Plan complete. Nice work.
          </p>
        ) : null}
      </div>

      <ol className="mt-6 space-y-3">
        {plan.tasks.map((task, index) => (
          <li
            key={task.id}
            className={`flex gap-4 rounded-2xl border border-border/70 bg-card p-4 transition-opacity ${
              task.done ? "opacity-60" : ""
            }`}
          >
            <Checkbox
              id={task.id}
              checked={task.done}
              onCheckedChange={() => toggleTask(plan.id, task.id)}
              className="mt-1 size-5"
              aria-label={`Mark "${task.title}" as ${task.done ? "not done" : "done"}`}
            />
            <div className="min-w-0">
              <label
                htmlFor={task.id}
                className={`font-display text-base font-semibold ${task.done ? "line-through" : ""}`}
              >
                {index + 1}. {task.title}
              </label>
              <p className="mt-1 text-sm text-muted-foreground">{task.detail}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>{task.estimateMinutes} min</span>
                {task.dueHint ? <span className="text-accent">{task.dueHint}</span> : null}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen glow-surface">
      <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <Button asChild variant="ghost" className="-ml-3 mb-6 text-muted-foreground">
          <Link to="/">
            <ArrowLeft className="size-4" aria-hidden />
            Dashboard
          </Link>
        </Button>
        {children}
      </div>
    </main>
  );
}
