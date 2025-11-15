export type SuggestResponse = {
  subtasks: { title: string }[];
  priority: "low" | "medium" | "high" | "urgent";
  dueDateHint?: string;
};

export async function suggestTaskStructure(input: {
  title: string;
  description?: string;
  tags?: string[];
  estimateMinutes?: number;
  dueDate?: string;
}): Promise<SuggestResponse> {
  const res = await fetch("/api/ai/suggest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: input.title,
      description: input.description,
      context: {
        tags: input.tags,
        estimateMinutes: input.estimateMinutes,
        dueDate: input.dueDate,
      },
    }),
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return (await res.json()) as SuggestResponse;
}