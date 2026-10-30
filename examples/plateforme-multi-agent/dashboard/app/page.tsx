import Link from "next/link";
import { AGENTS, compteurs } from "@/lib/livrables";

export const dynamic = "force-dynamic";

export default function Home() {
  const n = compteurs();
  const metier = AGENTS.filter((a) => !("support" in a));
  const support = AGENTS.filter((a) => "support" in a);
  return (
    <div className="space-y-12">
      <section>
        <p className="text-xs tracking-widest text-accent font-semibold">ORCHESTRATEUR · CLAUDE CODE</p>
        <h1 className="text-4xl font-bold mt-2">5 agents, 1 orchestrateur.</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Les livrables sont lus directement dans les dossiers du projet. Lance la chaîne depuis Claude Code avec{" "}
          <code className="bg-slate-200 px-1 rounded">/campagne &lt;client&gt; &lt;objectif&gt;</code>.
        </p>
      </section>

      <section>
        <h2 className="text-sm font-semibold tracking-widest text-slate-500 mb-4">AGENTS MÉTIER</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {metier.map((a, i) => (
            <Link key={a.id} href={`/agents/${a.id}`}
              className="rounded-xl bg-white border border-slate-200 p-5 hover:border-accent transition">
              <div className="text-xs text-slate-400">Étape {i + 1} · {a.modele}</div>
              <div className="text-lg font-semibold mt-1">{a.nom}</div>
              <div className="text-sm text-slate-600 mt-1">{a.role}</div>
              <div className="mt-4 text-3xl font-bold text-accent">{n[a.id]}</div>
              <div className="text-xs text-slate-400">livrable(s) · {a.dossier}/</div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold tracking-widest text-slate-500 mb-4">AGENTS SUPPORT</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {support.map((a) => (
            <Link key={a.id} href={`/agents/${a.id}`}
              className="rounded-xl bg-white border border-slate-200 p-5 hover:border-accent transition flex justify-between">
              <div>
                <div className="font-semibold">{a.nom}</div>
                <div className="text-sm text-slate-600">{a.role}</div>
              </div>
              <div className="text-2xl font-bold text-slate-400">{n[a.id]}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
