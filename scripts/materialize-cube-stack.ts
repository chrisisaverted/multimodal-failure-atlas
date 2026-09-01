import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { z } from "zod";
import { cubeHeights, cubeStackCandidateSchema, cubeStackVersion, renderCubeStackSvg } from "../src/lib/discovery/cube-stack";
import { sha256 } from "../src/lib/evaluation/hash";
const planPath=resolve(process.argv[2]??"evaluation/discovery/cube-stack-discovery-v1.json"),bytes=await readFile(planPath),plan=z.object({id:z.string(),generatorVersion:z.literal(cubeStackVersion),status:z.string(),candidates:z.array(cubeStackCandidateSchema)}).parse(JSON.parse(bytes.toString())),output=resolve(process.argv[3]??`public/evaluations/${plan.id}`);
await mkdir(output,{recursive:true});const cases=[];
for(const[index,c]of plan.candidates.entries()){
  const totals=Array.from({length:4},(_,panel)=>cubeHeights(c,panel).reduce((a,b)=>a+b,0));
  if(totals.filter(x=>x===c.parameters.targetTotal).length!==1)throw new Error("Cube oracle mismatch");
  const controls=plan.status==="frozen-confirmatory-holdout"?[false,true]:[false];
  for(const oracle of controls){
    const artifact=join(output,`${c.id}${oracle?"-oracle":""}.png`);
    await sharp(Buffer.from(renderCubeStackSvg(c,oracle))).png().toFile(artifact);
    cases.push({candidateId:c.id,cellId:c.cellId,split:c.split,condition:oracle?"panel-totals-annotated":"native-image",interventionDescription:oracle?"Every panel's exact cube total is printed below it.":"Four solid 3×3 column structures have adjacent total cube counts.",failureModeId:c.failureModeId,generator:"cube-stack",seed:c.seed,difficulty:oracle?0:77,variant:index+(oracle?100:0),artifact:artifact.slice(resolve(".").length+1),mimeType:"image/png",question:c.question,answerOptions:c.answerOptions,expectedAnswer:c.expectedAnswer,sha256:sha256(new Uint8Array(await readFile(artifact))),parameters:c.parameters,humanSolvability:c.humanSolvability,systemMessage:oracle?"Read the printed totals and return exactly one allowed panel letter.":"Count all unit cubes, including hidden cubes supporting higher cubes. Return exactly one allowed panel letter."});
  }
}
await writeFile(join(output,"manifest.json"),`${JSON.stringify({id:plan.id,planSha256:sha256(bytes),generatorVersion:plan.generatorVersion,renderer:plan.status==="frozen-confirmatory-holdout"?"cube-stack-isometric-svg-v1-with-total-control":"cube-stack-isometric-svg-v1",fps:0,cases},null,2)}\n`);console.log({output,cases:cases.length});
