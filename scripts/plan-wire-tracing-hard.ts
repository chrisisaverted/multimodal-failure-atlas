import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createWireTracingCandidate, wireTracingGeneratorVersion } from "../src/lib/discovery/wire-tracing";
const candidates=[];let seed=720_000;
for(let replicate=0;replicate<2;replicate++)for(let endpoint=0;endpoint<4;endpoint++)candidates.push(createWireTracingCandidate({split:"discovery",seed:seed++,crossings:64,sourceWire:(replicate+endpoint)%4,targetEndpoint:endpoint,visualVariant:100+replicate*4+endpoint}));
const output=resolve("evaluation/discovery/wire-tracing-discovery-v3.json");await mkdir(dirname(output),{recursive:true});await writeFile(output,`${JSON.stringify({id:"wire-tracing-discovery-v3",generatorVersion:wireTracingGeneratorVersion,status:"discovery-only",supersedes:"wire-tracing-discovery-v2 40-crossing cell, which Kimi solved above the admission bar",hypothesis:"At 64 occluding crossings, continuous curve identity exceeds frontier visual tracing capacity while remaining manually traceable at native resolution.",candidates},null,2)}\n`);console.log({output,candidates:candidates.length});
