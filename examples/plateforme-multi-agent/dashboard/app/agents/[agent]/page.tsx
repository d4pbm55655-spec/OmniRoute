import Link from "next/link";
import { notFound } from "next/navigation";
import { AGENTS, fmt, listerLivrables, type AgentId } from "@/lib/livrables";

export const dynamic = "force-dynamic";

const STATUT: Record<string, string> = {
  brouillon: "bg-slate-200 text-slate-700",
  "a-valider": "bg-amber-100 text-amber-800",
  valide: "bg-emerald-100 text-emerald-800",
  livre: "bg-sky-100 text-sky-800",
  rejete: "bg-rose-100 text-rose-800",
};

export default async function AgentPage({ params }: { params: Promise<{ agent: string }> }) {
  const { agent } = await params;
  const a = AGENTS.find((x) => x.id === agent);
  if (!a) notFound();
  const items = listerLivrables(a.id as AgentId);
  return (
    <div>
      <Link href="/" className="text-sm text-slate-500 hover:text-accent">← Agents</Link>
      <h1 className="text-3xl font-bold mt-2">{a.nom}</h1>
      <p className="text-slate-600">{a.role} · modèle {a.modele} · <code>{a.dossier}/</code></p>

      {items.length === 0 ? (
        <p className="mt-10 text-slate-500">Aucun livrable pour l’instant.</p>
      ) : (
        <table className="mt-8 w-full text-sm bg-white rounded-xl overflow-hidden border border-slate-200">
          <thead className="text-left text-xs uppercase tracking-wide text-slate-500 bg-slate-50">
            <tr><th className="p-3">Livrable</th><th className="p-3">Client</th><th className="p-3">Date</th><th className="p-3">v</th><th className="p-3">Statut</th></tr>
          </thead>
          <tbody>
            {items.map((l) => (
              <tr key={l.chemin} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="p-3">
                  <Link href={`/livrable/${l.chemin}`} className="font-medium hover:text-accent">{l.titre}</Link>
                  <div className="text-xs text-slate-400">{l.chemin}</div>
                </td>
                <td className="p-3">{fmt(l.data.client)}</td>
                <td className="p-3">{fmt(l.data.date)}</td>
                <td className="p-3">{fmt(l.data.version)}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${STATUT[fmt(l.data.statut)] ?? "bg-slate-100"}`}>
                    {fmt(l.data.statut) || "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
