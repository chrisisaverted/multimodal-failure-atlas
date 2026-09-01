import admittedFamilies from "@/data/admitted-families.json";

export const dynamic = "force-static";

export function GET() {
  return Response.json(admittedFamilies, {
    headers: { "Cache-Control": "public, max-age=0, must-revalidate" },
  });
}
