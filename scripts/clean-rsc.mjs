import { readdir, unlink, rmdir } from "fs/promises";
import { join } from "path";

const outDir = "out";
let deletedFiles = 0;
let deletedDirs = 0;

// Pass 1: delete all .txt RSC files
async function deleteTxtFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await deleteTxtFiles(full);
    else if (entry.name.endsWith(".txt")) { await unlink(full); deletedFiles++; }
  }
}

// Pass 2: remove empty directories left by RSC cleanup (bottom-up)
async function removeEmptyDirs(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const full = join(dir, entry.name);
      await removeEmptyDirs(full);
      try {
        const remaining = await readdir(full);
        if (remaining.length === 0) { await rmdir(full); deletedDirs++; }
      } catch {}
    }
  }
}

await deleteTxtFiles(outDir);
await removeEmptyDirs(outDir);
console.log(`Cleaned ${deletedFiles} RSC .txt files and ${deletedDirs} empty directories from ${outDir}/`);
