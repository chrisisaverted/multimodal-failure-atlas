import { fiveRouteEvidence } from "@/lib/five-route-evidence";

export const dynamic = "force-static";

export function GET() {
  return Response.json(fiveRouteEvidence, {
    headers: { "Cache-Control": "public, max-age=0, must-revalidate" },
  });
}
