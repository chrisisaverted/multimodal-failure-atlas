import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";

const exportRoot = resolve(process.argv[2] ?? "out");
const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/multimodal-failure-atlas";
const basePath = configuredBasePath.replace(/\/$/, "");

function filesBelow(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? filesBelow(path) : [path];
  });
}

function localTarget(rawReference: string) {
  if (
    rawReference.startsWith("#") ||
    rawReference.startsWith("data:") ||
    rawReference.startsWith("mailto:") ||
    rawReference.startsWith("http://") ||
    rawReference.startsWith("https://")
  )
    return null;

  const withoutSuffix = rawReference.split(/[?#]/, 1)[0] ?? "";
  if (!withoutSuffix.startsWith("/")) return null;
  const relative =
    basePath && withoutSuffix.startsWith(`${basePath}/`)
      ? withoutSuffix.slice(basePath.length)
      : withoutSuffix;
  const decoded = decodeURIComponent(relative).replace(/^\/+/, "");
  const path = resolve(exportRoot, decoded);
  if (path !== exportRoot && !path.startsWith(`${exportRoot}/`)) {
    throw new Error(`Export reference escapes root: ${rawReference}`);
  }
  if (decoded === "" || decoded.endsWith("/")) return join(path, "index.html");
  if (!extname(decoded)) return existsSync(path) ? path : join(path, "index.html");
  return path;
}

if (!existsSync(exportRoot)) throw new Error(`Static export does not exist: ${exportRoot}`);

const htmlFiles = filesBelow(exportRoot).filter((path) => path.endsWith(".html"));
const missing = new Map<string, Set<string>>();
let references = 0;

for (const htmlPath of htmlFiles) {
  const html = readFileSync(htmlPath, "utf8");
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const reference = match[1]!;
    const target = localTarget(reference);
    if (!target) continue;
    references += 1;
    if (!existsSync(target)) {
      const sources = missing.get(reference) ?? new Set<string>();
      sources.add(htmlPath.slice(exportRoot.length + 1));
      missing.set(reference, sources);
    }
  }
}

if (missing.size) {
  for (const [reference, sources] of missing) {
    console.error(`${reference} <- ${[...sources].slice(0, 3).join(", ")}`);
  }
  throw new Error(`${missing.size} internal export reference(s) are missing`);
}

console.log(JSON.stringify({ htmlFiles: htmlFiles.length, internalReferences: references, missing: 0 }));
