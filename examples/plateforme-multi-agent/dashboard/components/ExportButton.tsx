"use client";
import { useState } from "react";

export default function ExportButton({ chemin, endpoint, label }: { chemin: string; endpoint: string; label: string }) {
  const [etat, setEtat] = useState<"idle" | "busy" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");

  async function go() {
    setEtat("busy");
    setMsg("");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chemin }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? res.statusText);
      if (res.headers.get("content-type")?.includes("application/pdf")) {
        const url = URL.createObjectURL(await res.blob());
        window.open(url, "_blank");
        setMsg("PDF généré et enregistré à côté du fichier.");
      } else {
        const j = await res.json();
        setMsg(`${j.fichiers?.length ?? 0} image(s) → ${j.dossier ?? ""}`);
      }
      setEtat("ok");
    } catch (e) {
      setEtat("err");
      setMsg(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div>
      <button onClick={go} disabled={etat === "busy"}
        className="w-full rounded-lg bg-accent text-white font-semibold py-2.5 hover:opacity-90 disabled:opacity-50">
        {etat === "busy" ? "Génération…" : label}
      </button>
      {msg && <p className={`mt-2 text-xs ${etat === "err" ? "text-rose-600" : "text-slate-500"}`}>{msg}</p>}
    </div>
  );
}
