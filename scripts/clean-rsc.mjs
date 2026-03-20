import { readdir, unlink } from "fs/promises";
import { join } from "path";

const outDir = "out";
let deleted = 0;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith(".txt")) { await unlink(full); deleted++; }
  }
}

await walk(outDir);
console.log(`Cleaned ${deleted} RSC .txt files from ${outDir}/`);
