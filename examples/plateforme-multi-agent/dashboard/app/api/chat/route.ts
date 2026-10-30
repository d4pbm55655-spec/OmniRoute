import fs from "node:fs";
import path from "node:path";
import { anthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { PROJECT_ROOT, lireLivrable } from "@/lib/livrables";

export const runtime = "nodejs";
export const maxDuration = 120;

// Chat interactif : questions sur les livrables, retouches rapides. La production reste dans Claude Code.
export async function POST(req: Request) {
  const { messages, chemin }: { messages: UIMessage[]; chemin?: string } = await req.json();
  const contrat = fs.readFileSync(path.join(PROJECT_ROOT, "CLAUDE.md"), "utf8");
  let contexte = "";
  if (chemin) {
    try {
      const l = lireLivrable(chemin);
      contexte = `\n\n## Livrable ouvert : ${chemin}\n\n${l.content}`;
    } catch { /* ignoré */ }
  }
  const result = streamText({
    model: anthropic(process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5"),
    system:
      "Tu es l'assistant du dashboard de la plateforme Multi-Agent. Tu réponds en français, de façon concise. " +
      "Tu aides à relire, comparer et retoucher les livrables. Tu n'inventes aucun chiffre. " +
      "Pour produire un nouveau livrable officiel, renvoie vers la slash command Claude Code adaptée.\n\n" +
      contrat + contexte,
    messages: await convertToModelMessages(messages),
  });
  return result.toUIMessageStreamResponse();
}
