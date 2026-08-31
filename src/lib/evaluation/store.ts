import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { evaluationRunSchema, type EvaluationRunRecord } from "./schema";

export interface EvaluationStore {
  all(): Promise<EvaluationRunRecord[]>;
  find(id: string): Promise<EvaluationRunRecord | undefined>;
  append(record: EvaluationRunRecord): Promise<void>;
  spentUsd(): Promise<number>;
}

export class MemoryEvaluationStore implements EvaluationStore {
  readonly records: EvaluationRunRecord[] = [];

  async all() {
    return [...this.records];
  }

  async find(id: string) {
    return this.records.find((record) => record.id === id);
  }

  async append(record: EvaluationRunRecord) {
    if (await this.find(record.id)) throw new Error(`Immutable run ${record.id} already exists.`);
    this.records.push(evaluationRunSchema.parse(record));
  }

  async spentUsd() {
    return this.records.reduce((total, record) => total + record.costUsd, 0);
  }
}

export class JsonlEvaluationStore implements EvaluationStore {
  constructor(private readonly path: string) {}

  async all() {
    let body: string;
    try {
      body = await readFile(this.path, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
    return body
      .split("\n")
      .filter(Boolean)
      .map((line, index) => {
        try {
          return evaluationRunSchema.parse(JSON.parse(line));
        } catch (error) {
          throw new Error(`Invalid immutable run record at line ${index + 1} of ${this.path}`, {
            cause: error,
          });
        }
      });
  }

  async find(id: string) {
    return (await this.all()).find((record) => record.id === id);
  }

  async append(record: EvaluationRunRecord) {
    if (await this.find(record.id)) throw new Error(`Immutable run ${record.id} already exists.`);
    await mkdir(dirname(this.path), { recursive: true });
    await appendFile(this.path, `${JSON.stringify(evaluationRunSchema.parse(record))}\n`, {
      encoding: "utf8",
      flag: "a",
      mode: 0o600,
    });
  }

  async spentUsd() {
    return (await this.all()).reduce((total, record) => total + record.costUsd, 0);
  }
}
