import { BACKEND_URL, erreur } from "@/lib/routes";

const SERVICES = new Set(["gmail", "youtube", "drive", "fireflies"]);

// POST /api/integrations/{gmail|youtube|drive|fireflies}/sync → délégué au backend FastAPI
export async function POST(_req: Request, { params }: { params: Promise<{ service: string }> }) {
  const { service } = await params;
  if (!SERVICES.has(service)) return erreur(`Intégration inconnue : ${service}`, 404);
  try {
    const res = await fetch(`${BACKEND_URL}/integrations/${service}/sync`, { method: "POST" });
    return Response.json(await res.json(), { status: res.status });
  } catch {
    return erreur("Backend injoignable : lance `uvicorn api.server:app --port 8000` à la racine.", 502);
  }
}
