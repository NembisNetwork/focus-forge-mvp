import { Link } from "@tanstack/react-router";
import { CalendarDays, Flame, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  deletePlan,
  planProgress,
  type Difficulty,
  type Plan,
  type Priority,
} from "@/lib/plan-store";

const difficultyLabel: Record<Difficulty, string> = {
  easy: "Light",
  medium: "Steady",
  hard: "Intense",
};

const priorityLabel: Record<Priority, string> = {
  high: "High priority",
  medium: "Medium priority",
  low: "Low priority",
};

const priorityClass: Record<Priority, string> = {
  high: "border-primary/50 bg-primary/15 text-primary",
  medium: "border-accent/50 bg-accent/15 text-accent",
  low: "border-border/70 bg-secondary/60 text-muted-foreground",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge variant="outline" className={`text-xs font-medium ${priorityClass[priority]}`}>
      {priorityLabel[priority]}
    </Badge>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <Badge
      variant="outline"
      className="border-border/70 bg-secondary/60 text-xs font-medium text-foreground"
    >
      <Flame className="mr-1 size-3 text-primary" aria-hidden />
      {difficultyLabel[difficulty]}
    </Badge>
  );
}

export function PlanCard({ plan }: { plan: Plan }) {
  const { done, total, percent } = planProgress(plan);

  return (
    <article className="group relative flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-5 transition-colors hover:border-primary/50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold">{plan.title || plan.goal}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{plan.description}</p>
        </div>

        <Button
          size="icon"
          variant="ghost"
          aria-label="Delete plan"
          className="shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => deletePlan(plan.id)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="size-3.5" aria-hidden />
          {plan.deadline}
        </span>
        <DifficultyBadge difficulty={plan.difficulty} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {done} of {total} steps done
          </span>
          <span className="font-semibold text-primary">{percent}%</span>
        </div>
        <Progress value={percent} className="h-2 bg-secondary" />
      </div>

      <Button asChild variant="secondary" className="mt-auto">
        <Link to="/plan/$planId" params={{ planId: plan.id }}>
          Open plan
        </Link>
      </Button>
    </article>
  );
}
