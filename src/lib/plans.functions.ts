import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const PlanInput = z.object({
  goal: z.string().min(3).max(400),
  deadline: z.string().min(1).max(40),
  difficulty: z.enum(["easy", "medium", "hard"]),
  context: z.string().max(600).optional(),
});

const GeneratedPlan = z.object({
  title: z.string(),
  description: z.string(),
  tasks: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      priority: z.enum(["high", "medium", "low"]),
      estimated_time: z.string(),
      completed: z.boolean(),
    }),
  ),
});

export type GeneratedPlan = z.infer<typeof GeneratedPlan>;

export class PlanGenerationError extends Error {}

const jsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "description", "tasks"],
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    tasks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "description", "priority", "estimated_time", "completed"],
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          priority: { type: "string", enum: ["high", "medium", "low"] },
          estimated_time: { type: "string" },
          completed: { type: "boolean" },
        },
      },
    },
  },
} as const;

export const generatePlan = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PlanInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["OPENAI_API_KEY"];
    if (!key) throw new PlanGenerationError("AI is not configured yet.");

    const prompt = [
      `Goal: ${data.goal}`,
      `Deadline: ${data.deadline}`,
      `Difficulty / intensity: ${data.difficulty}`,
      data.context ? `Extra context: ${data.context}` : "",
      "",
      "Break this goal into a concrete, ordered action plan.",
      "title: a short plan name under 60 characters.",
      "description: one motivating sentence under 160 characters.",
      "Return between 5 and 9 tasks. Each task title is under 70 characters and starts with a verb.",
      "Each task description is one or two practical how-to sentences under 220 characters.",
      "priority is high, medium or low. estimated_time is a short human string like '45 min' or '2 h'.",
      "completed is always false.",
      "Harder difficulty means deeper, more demanding tasks, not just more of them.",
    ]
      .filter(Boolean)
      .join("\n");

    let response: Response;
    try {
      response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a pragmatic planning coach for students, freelancers and young professionals. You produce specific, doable steps in JSON, never vague advice.",
            },
            { role: "user", content: prompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: { name: "action_plan", strict: true, schema: jsonSchema },
          },
        }),
      });
    } catch (error) {
      console.error("OpenAI request failed", error);
      throw new PlanGenerationError("The planning service is unreachable right now.");
    }

    if (!response.ok) {
      console.error("OpenAI error", response.status, await response.text().catch(() => ""));
      throw new PlanGenerationError(
        response.status === 429
          ? "The planning service is busy. Please try again in a moment."
          : "The planning service rejected that request.",
      );
    }

    const payload = (await response.json().catch(() => null)) as
      | { choices?: { message?: { content?: string } }[] }
      | null;
    const content = payload?.choices?.[0]?.message?.content;
    const parsed = safeParse(content);
    if (!parsed || parsed.tasks.length === 0) {
      throw new PlanGenerationError("The plan came back in an unexpected shape.");
    }
    return normalize(parsed);
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
    title: plan.title.slice(0, 90),
    description: plan.description.slice(0, 200),
    tasks: plan.tasks.slice(0, 9).map((task) => ({
      title: task.title.slice(0, 90),
      description: task.description.slice(0, 300),
      priority: task.priority,
      estimated_time: (task.estimated_time || "").slice(0, 30),
      completed: false,
    })),
  };
}
