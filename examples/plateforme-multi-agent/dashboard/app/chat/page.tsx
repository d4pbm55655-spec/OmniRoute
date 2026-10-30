"use client";
import { useState } from "react";
import { useChat } from "@ai-sdk/react";

export default function ChatPage() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState("");
  const [chemin, setChemin] = useState("");
  const busy = status === "submitted" || status === "streaming";

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold">Chat</h1>
      <p className="text-slate-600 text-sm mt-1">
        Pose une question sur un livrable (ex. « compare les deux hooks »). Pour produire, utilise les slash commands dans Claude Code.
      </p>
      <input value={chemin} onChange={(e) => setChemin(e.target.value)}
        placeholder="Livrable en contexte (optionnel) : briefs/2026-10-30-demo-lancement.md"
        className="mt-6 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white" />
      <div className="mt-6 space-y-4">
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "text-right" : ""}>
            <div className={`inline-block rounded-xl px-4 py-3 text-sm whitespace-pre-wrap text-left max-w-[90%] ${
              m.role === "user" ? "bg-nuit text-creme" : "bg-white border border-slate-200"}`}>
              {m.parts.map((p, i) => (p.type === "text" ? <span key={i}>{p.text}</span> : null))}
            </div>
          </div>
        ))}
      </div>
      <form className="mt-6 flex gap-2" onSubmit={(e) => {
        e.preventDefault();
        if (!input.trim()) return;
        sendMessage({ text: input }, { body: { chemin: chemin || undefined } });
        setInput("");
      }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} disabled={busy}
          placeholder="Ton message…" className="flex-1 rounded-lg border border-slate-300 px-3 py-2 bg-white" />
        <button disabled={busy} className="rounded-lg bg-accent text-white font-semibold px-5 disabled:opacity-50">
          {busy ? "…" : "Envoyer"}
        </button>
      </form>
    </div>
  );
}
