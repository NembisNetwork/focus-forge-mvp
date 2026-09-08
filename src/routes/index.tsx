import { Link, createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, ListChecks, Plus, Sparkles, Target } from "lucide-react";

import { PlanCard } from "@/components/plan-bits";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { planProgress, usePlans } from "@/lib/plan-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Momentum AI Planner" },
      {
        name: "description",
        content:
          "See every goal, its deadline and your progress in one place. Momentum turns goals into AI-generated task plans.",
      },
      { property: "og:title", content: "Dashboard — Momentum AI Planner" },
      {
        property: "og:description",
        content: "Every goal, deadline and step of progress in one focused dashboard.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { plans, loading } = usePlans();
  const list = plans ?? [];

  const totalTasks = list.reduce((sum, plan) => sum + plan.tasks.length, 0);
  const doneTasks = list.reduce((sum, plan) => sum + planProgress(plan).done, 0);
  const activePlans = list.filter((plan) => planProgress(plan).percent < 100).length;

  return (
    <main className="min-h-screen glow-surface">
      <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="size-5" aria-hidden />
            </span>
            <span className="font-display text-lg font-semibold">Momentum</span>
          </div>
          <Button asChild>
            <Link to="/new">
              <Plus className="size-4" aria-hidden />
              New plan
            </Link>
          </Button>
        </header>

        <section className="mt-10">
          <h1 className="max-w-2xl text-3xl font-semibold sm:text-4xl">
            Your goals, broken into steps you can actually start today.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Describe a goal, set a deadline and pick an intensity. Momentum writes the plan and
            keeps score as you check things off.
          </p>
        </section>

        <section className="mt-8 grid gap-3 sm:grid-cols-3">
          <Stat icon={<Target className="size-4" />} label="Active plans" value={activePlans} />
          <Stat icon={<ListChecks className="size-4" />} label="Total steps" value={totalTasks} />
          <Stat icon={<CheckCircle2 className="size-4" />} label="Completed" value={doneTasks} />
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">Plans</h2>

          {loading ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-56 rounded-2xl bg-card" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-border/80 bg-card/50 p-10 text-center">
              <p className="font-display text-lg font-semibold">No plans yet</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                Try something like “Prepare for my statistics final” or “Launch my freelance
                portfolio site”.
              </p>
              <Button asChild className="mt-5">
                <Link to="/new">Create your first plan</Link>
              </Button>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="text-primary">{icon}</span>
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
    </div>
  );
}
