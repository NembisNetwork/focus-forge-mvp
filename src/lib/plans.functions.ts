import { createServerFn } from "@tanstack/react-start";
import { NoObjectGeneratedError, Output, streamText } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const PlanInput = z.object({
  goal: z.string().min(3).max(400),
  deadline: z.string().min(1).max(40),
  difficulty: z.enum(["easy", "medium", "hard"]),
  context: z.string().max(600).optional(),
});

const GeneratedPlan = z.object({
  summary: z.string(),
  tasks: z.array(
    z.object({
      title: z.string(),
      detail: z.string(),
      estimateMinutes: z.number(),
      dueHint: z.string(),
    }),
  ),
});

export type GeneratedPlan = z.infer<typeof GeneratedPlan>;

export const generatePlan = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PlanInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured yet.");

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3.8-flash");

    const prompt = [
      `Goal: ${data.goal}`,
      `Deadline: ${data.deadline}`,
      `Difficulty / intensity: ${data.difficulty}`,
      data.context ? `Extra context: ${data.context}` : "",
      "",
      "Break this goal into a concrete, ordered action plan.",
      "Rules: return between 5 and 9 tasks. Each title is under 70 characters and starts with a verb.",
      "Each detail is one or two sentences of practical how-to, under 220 characters.",
      "estimateMinutes is a realistic whole number of minutes of focused work.",
      "dueHint is a short scheduling hint like 'Day 1' or 'Week 2', consistent with the deadline.",
      "summary is one motivating sentence under 160 characters.",
      "Harder difficulty means deeper, more demanding tasks, not just more of them.",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const result = streamText({
        model,
        system:
          "You are a pragmatic planning coach for students, freelancers and young professionals. You produce specific, doable steps, never vague advice.",
        prompt,
        output: Output.object({ schema: GeneratedPlan }),
      });

      const output = await result.output;
      return normalize(output);
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        const parsed = safeParse(error.text);
        if (parsed) return normalize(parsed);
      }
      throw error;
    }
  });

function safeParse(text: string | undefined): GeneratedPlan | undefined {
  if (!text) return undefined;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return undefined;
  try {
    const parsed = GeneratedPlan.safeParse(JSON.parse(text.slice(start, end + 1)));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

function normalize(plan: GeneratedPlan): GeneratedPlan {
  return {
    summary: plan.summary.slice(0, 200),
    tasks: plan.tasks.slice(0, 9).map((task) => ({
      title: task.title.slice(0, 90),
      detail: task.detail.slice(0, 300),
      estimateMinutes: Math.max(5, Math.min(600, Math.round(task.estimateMinutes || 30))),
      dueHint: (task.dueHint || "").slice(0, 40),
    })),
  };
}
