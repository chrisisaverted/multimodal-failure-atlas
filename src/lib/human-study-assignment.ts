export type StudyAssignmentMode = "quota-link" | "random-demo";

export function assignHumanStudyBlock(
  blockIds: readonly string[],
  requestedBlockId: string | null,
  randomUint32: number,
): { blockId: string; assignmentMode: StudyAssignmentMode } {
  if (!blockIds.length) throw new Error("The study manifest has no blocks");
  if (new Set(blockIds).size !== blockIds.length)
    throw new Error("The study manifest has duplicate block IDs");
  if (requestedBlockId !== null) {
    if (!blockIds.includes(requestedBlockId))
      throw new Error(`Unknown study block in recruitment link: ${requestedBlockId}`);
    return { blockId: requestedBlockId, assignmentMode: "quota-link" };
  }
  if (!Number.isInteger(randomUint32) || randomUint32 < 0 || randomUint32 > 0xffffffff)
    throw new Error("Random assignment requires one unsigned 32-bit integer");
  return {
    blockId: blockIds[randomUint32 % blockIds.length]!,
    assignmentMode: "random-demo",
  };
}
