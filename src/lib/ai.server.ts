import { generateResponse } from "@lovable.dev/ai-gateway";

export async function aiJson<T>(instructions: string, input: string, schemaName: string, schema: Record<string, unknown>, opts: { webSearch?: boolean } = {}): Promise<T> {
  const res = await generateResponse({
    model: "openai/gpt-6-astra",
    instructions,
    input,
    text: { format: { type: "json_schema", name: schemaName, schema, strict: true } },
    ...(opts.webSearch ? { tools: [{ type: "web_search" as const }] } : {}),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = res as any;
  let text: string = r.output_text ?? "";
  if (!text) {
    for (const item of r.output ?? []) for (const c of item.content ?? []) if (c.type === "output_text") text += c.text;
  }
  return JSON.parse(text) as T;
}

export async function hashSender(neighborhoodId: string, sender: string): Promise<string> {
  const data = new TextEncoder().encode(`${neighborhoodId}:${sender.trim().toLowerCase()}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
