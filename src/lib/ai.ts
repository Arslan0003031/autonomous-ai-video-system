export async function openAIJson<T>(prompt: string, schemaName = "result"): Promise<T> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is required");
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_TEXT_MODEL || "gpt-5-mini",
      input: prompt,
      text: { format: { type: "json_object", name: schemaName } },
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.output_text ?? data.output?.flatMap((x: any) => x.content ?? []).map((c: any) => c.text ?? "").join("");
  if (!text) throw new Error("OpenAI returned no text");
  return JSON.parse(text) as T;
}

export async function openAIImage(prompt: string): Promise<Buffer> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is required");
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1", prompt, size: "1536x1024", quality: "medium", output_format: "png" }),
  });
  if (!res.ok) throw new Error(`OpenAI image error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI image response did not contain image data");
  return Buffer.from(b64, "base64");
}
