import { createHash } from "node:crypto";

export const sha256 = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");

export function commitmentFor(seed: number, generatorVersion: string, secretSalt: string) {
  if (!secretSalt) throw new Error("A private salt is required for seed commitments.");
  return sha256(`${generatorVersion}:${seed}:${secretSalt}`);
}
