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



export const generatePlan = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PlanInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["GEMINI_API_KEY"];
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
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-goog-api-key": key,
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text: "You are a pragmatic planning coach for students, freelancers and young professionals. You produce specific, doable steps in JSON, never vague advice.",
                },
              ],
            },
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: {
                type: "OBJECT",
                required: ["title", "description", "tasks"],
                properties: {
                  title: { type: "STRING" },
                  description: { type: "STRING" },
                  tasks: {
                    type: "ARRAY",
                    items: {
                      type: "OBJECT",
                      required: ["title", "description", "priority", "estimated_time", "completed"],
                      properties: {
                        title: { type: "STRING" },
                        description: { type: "STRING" },
                        priority: { type: "STRING", enum: ["high", "medium", "low"] },
                        estimated_time: { type: "STRING" },
                        completed: { type: "BOOLEAN" },
                      },
                    },
                  },
                },
              },
            },
          }),
        },
      );
    } catch (error) {
      console.error("Gemini request failed", error);
      throw new PlanGenerationError("The planning service is unreachable right now.");
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("Gemini error", response.status, errorText);
      if (
        errorText.includes("insufficient_quota") ||
        errorText.includes("credit_balance_exhausted") ||
        errorText.includes("quota") ||
        errorText.includes("RESOURCE_EXHAUSTED")
      ) {
        throw new PlanGenerationError(
          "The AI account is out of credits. Please top it up, then try again.",
        );
      }
      throw new PlanGenerationError(
        response.status === 429
          ? "The planning service is busy. Please try again in a moment."
          : "The planning service rejected that request.",
      );
    }

    const payload = (await response.json().catch(() => null)) as
      | { candidates?: { content?: { parts?: { text?: string }[] } }[] }
      | null;
    const content = payload?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("");
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
