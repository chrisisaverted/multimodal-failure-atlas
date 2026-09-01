import admittedRuns from "@/data/admitted-runs.json";

export const dynamic = "force-static";

export function GET() {
  return Response.json(admittedRuns, {
    headers: { "Cache-Control": "public, max-age=0, must-revalidate" },
  });
}
