// Parses WhatsApp chat exports (iPhone "[d/m/y, time] Name: text" and Android "d/m/y, time - Name: text").
export type ChatMessage = { sender: string; date: string; text: string };

const IOS = /^\u200e?\[(\d{1,4})[./-](\d{1,2})[./-](\d{1,4}),?\s+([\d:.]+)(?:\s?([AaPp]\.?\s?[Mm]\.?))?\]\s([^:]+?):\s([\s\S]*)$/;
const ANDROID = /^\u200e?(\d{1,4})[./-](\d{1,2})[./-](\d{1,4}),?\s+([\d:.]+)(?:\s?([AaPp]\.?\s?[Mm]\.?))?\s[-–]\s([^:]+?):\s([\s\S]*)$/;

function toIsoDate(a: string, b: string, c: string, dayFirst: boolean): string | null {
  let y: number, m: number, d: number;
  if (a.length === 4) { y = +a; m = +b; d = +c; }
  else {
    y = +c; if (y < 100) y += 2000;
    if (dayFirst) { d = +a; m = +b; } else { m = +a; d = +b; }
  }
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const SYSTEM = /(end-to-end encrypted|<Media omitted>|image omitted|video omitted|sticker omitted|audio omitted|This message was deleted|created group|added|left|changed the subject|changed this group)/i;

export function parseWhatsApp(raw: string): ChatMessage[] {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const parsed: { a: string; b: string; c: string; sender: string; text: string }[] = [];
  for (const line of lines) {
    const m = line.match(IOS) ?? line.match(ANDROID);
    if (m) parsed.push({ a: m[1] ?? "", b: m[2] ?? "", c: m[3] ?? "", sender: (m[6] ?? "").trim(), text: m[7] ?? "" });
    else if (parsed.length && line.trim()) parsed[parsed.length - 1]!.text += "\n" + line;
  }
  // Detect day-first ordering: if any first number > 12 it must be the day.
  const dayFirst = parsed.some((p) => p.a.length < 4 && +p.a > 12);
  const out: ChatMessage[] = [];
  for (const p of parsed) {
    const date = toIsoDate(p.a, p.b, p.c, dayFirst);
    const text = p.text.replace(/\u200e/g, "").trim();
    if (!date || !text || SYSTEM.test(text) && text.length < 80) continue;
    out.push({ sender: p.sender, date, text });
  }
  return out;
}

export async function readChatFile(file: File): Promise<string> {
  if (file.name.toLowerCase().endsWith(".zip")) {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(file);
    const entry = Object.values(zip.files).find((f) => !f.dir && f.name.toLowerCase().endsWith(".txt"));
    if (!entry) throw new Error("No chat text file found inside the zip");
    return entry.async("string");
  }
  return file.text();
}
