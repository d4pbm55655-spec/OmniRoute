import Link from "next/link";
import { notFound } from "next/navigation";
import { marked } from "marked";
import { fmt, lireLivrable } from "@/lib/livrables";
import ExportButton from "@/components/ExportButton";

export const dynamic = "force-dynamic";

export default async function LivrablePage({ params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const rel = path.map(decodeURIComponent).join("/");
  let l;
  try {
    l = lireLivrable(rel);
  } catch {
    notFound();
  }
  const isDeck = l.data.agent === "presentateur";
  const isReport = l.data.agent === "analyste";
  return (
    <div className="grid lg:grid-cols-[1fr_260px] gap-10">
      <article className="bg-white border border-slate-200 rounded-xl p-8 prose-md"
        dangerouslySetInnerHTML={{ __html: marked.parse(l.content) as string }} />
      <aside className="space-y-4 text-sm">
        <Link href={`/agents/${fmt(l.data.agent)}`} className="text-slate-500 hover:text-accent">← {fmt(l.data.agent)}</Link>
        <dl className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
          {Object.entries(l.data).map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs uppercase tracking-wide text-accent">{k}</dt>
              <dd className="break-words">{fmt(v)}</dd>
            </div>
          ))}
        </dl>
        {(isDeck || isReport) && (
          <ExportButton chemin={l.chemin} endpoint={isDeck ? "/api/presentations/generate" : "/api/reports/generate"}
            label={isDeck ? "Générer le PDF du deck" : "Générer le rapport PDF"} />
        )}
        {l.data.agent === "createur" && l.data.format === "linkedin-carrousel" && (
          <ExportButton chemin={l.chemin} endpoint="/api/carousels/generate" label="Générer le carrousel PNG" />
        )}
      </aside>
    </div>
  );
}
