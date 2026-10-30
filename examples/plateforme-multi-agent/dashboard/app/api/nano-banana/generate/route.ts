import { BACKEND_URL, erreur } from "@/lib/routes";

// POST { prompt, aspect?: "1:1"|"9:16"|"16:9"|"4:5", name? } → image Gemini via le backend FastAPI
export async function POST(req: Request) {
  try {
    const res = await fetch(`${BACKEND_URL}/images/gemini`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(await req.json()),
    });
    return Response.json(await res.json(), { status: res.status });
  } catch {
    return erreur("Backend injoignable : lance `uvicorn api.server:app --port 8000` à la racine.", 502);
  }
}
