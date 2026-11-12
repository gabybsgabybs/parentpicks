import { useState } from "react";
import { Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MCP_URL = "https://parentpicks.lovable.app/mcp";

const STEPS: Record<string, string[]> = {
  Claude: ["Open Claude → Settings → Connectors.", "Click “Add custom connector”.", "Name it Parent Picks and paste the link above.", "Start a chat and ask: “Find a pediatrician parents love.”"],
  ChatGPT: ["Open ChatGPT → Settings → Apps & Connectors (turn on Developer mode if asked).", "Create a new connector and paste the link above.", "Choose “No authentication”.", "In a chat, enable Parent Picks from the tools menu and ask away."],
  Other: ["Any assistant that supports MCP (Cursor, Muse, and more) works.", "Add a new MCP server of type “HTTP / Streamable HTTP”.", "Paste the link above — no login needed.", "Ask about San Francisco parent picks."],
};

export function McpConnect() {
  const [open, setOpen] = useState(false);
  async function copy() { await navigator.clipboard.writeText(MCP_URL); toast.success("Link copied"); }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="mt-3 flex w-full items-center gap-2 rounded-xl border border-border bg-secondary/60 px-3 py-2 text-left text-xs font-medium hover:bg-secondary">
          <Sparkles className="size-4 shrink-0 text-primary" />
          <span>Prefer Claude or ChatGPT? <span className="font-semibold underline">Connect Parent Picks →</span></span>
        </button>
      </DialogTrigger>
      <DialogContent className="z-[60]">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl">Use Parent Picks in your AI tool</DialogTitle>
          <DialogDescription>Ask Claude, ChatGPT or other assistants about places parents recommend. Only anonymous, 2+ parent picks are shared.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-popover p-2">
          <code className="min-w-0 flex-1 truncate px-2 text-sm">{MCP_URL}</code>
          <Button size="sm" onClick={copy}><Copy className="size-4" /> Copy</Button>
        </div>
        <Tabs defaultValue="Claude">
          <TabsList>{Object.keys(STEPS).map((k) => <TabsTrigger key={k} value={k}>{k}</TabsTrigger>)}</TabsList>
          {Object.entries(STEPS).map(([k, s]) => (
            <TabsContent key={k} value={k}><ol className="list-decimal space-y-1.5 pl-5 text-sm">{s.map((x) => <li key={x}>{x}</li>)}</ol></TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
