import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generatePlan } from "@/lib/plans.functions";
import { makeId, savePlan, type Difficulty } from "@/lib/plan-store";

export const Route = createFileRoute("/new")({
  head: () => ({
    meta: [
      { title: "Create a plan — Momentum AI Planner" },
      {
        name: "description",
        content:
          "Enter your goal, deadline and intensity, and get an ordered AI-generated task plan in seconds.",
      },
      { property: "og:title", content: "Create a plan — Momentum AI Planner" },
      {
        property: "og:description",
        content: "Goal in, ordered action plan out. Set a deadline and intensity to start.",
      },
    ],
  }),
  component: NewPlan,
});

const difficulties: { value: Difficulty; label: string; hint: string }[] = [
  { value: "easy", label: "Light", hint: "Gentle pace, small steps" },
  { value: "medium", label: "Steady", hint: "Balanced daily effort" },
  { value: "hard", label: "Intense", hint: "Deep work, fast progress" },
];

function NewPlan() {
  const navigate = useNavigate();
  const createPlan = useServerFn(generatePlan);

  const [goal, setGoal] = useState("");
  const [deadline, setDeadline] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = goal.trim().length > 2 && deadline.trim().length > 0 && !loading;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    try {
      const result = await createPlan({
        data: {
          goal: goal.trim(),
          deadline: deadline.trim(),
          difficulty,
          context: context.trim() || undefined,
        },
      });

      if (!result.tasks.length) throw new Error("empty");

      const id = makeId();
      savePlan({
        id,
        goal: goal.trim(),
        deadline: deadline.trim(),
        difficulty,
        context: context.trim() || undefined,
        summary: result.summary,
        createdAt: new Date().toISOString(),
        tasks: result.tasks.map((task) => ({ ...task, id: makeId(), done: false })),
      });

      navigate({ to: "/plan/$planId", params: { planId: id } });
    } catch {
      setError("We couldn't build that plan just now. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen glow-surface">
      <div className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-8 sm:py-14">
        <Button asChild variant="ghost" className="-ml-3 text-muted-foreground">
          <Link to="/">
            <ArrowLeft className="size-4" aria-hidden />
            Dashboard
          </Link>
        </Button>

        <h1 className="mt-6 text-3xl font-semibold sm:text-4xl">Create a plan</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The more specific your goal, the sharper the steps.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="goal">What do you want to get done?</Label>
            <Input
              id="goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Ship a portfolio site for freelance clients"
              maxLength={400}
              className="bg-card"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              placeholder="In 3 weeks, or 30 June"
              maxLength={40}
              className="bg-card"
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Intensity</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {difficulties.map((option) => {
                const selected = difficulty === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDifficulty(option.value)}
                    aria-pressed={selected}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      selected
                        ? "border-primary bg-primary/10"
                        : "border-border/70 bg-card hover:border-primary/40"
                    }`}
                  >
                    <span className="font-display text-base font-semibold">{option.label}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{option.hint}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="context">Anything else? (optional)</Label>
            <Textarea
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="I can work about 1 hour on weekday evenings and I already have a domain."
              maxLength={600}
              className="min-h-24 bg-card"
            />
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground"
            >
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={!canSubmit} className="w-full sm:w-auto">
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Building your plan…
              </>
            ) : (
              <>
                <Sparkles className="size-4" aria-hidden />
                Generate plan
              </>
            )}
          </Button>
        </form>
      </div>
    </main>
  );
}
