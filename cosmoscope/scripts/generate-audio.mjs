import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const sourcePath = new URL("../src/assets/audio/ambient-space.mp3.base64", import.meta.url);
const targetPath = new URL("../src/assets/audio/ambient-space.mp3", import.meta.url);

async function main() {
  try {
    const base64 = await readFile(sourcePath, "utf8");
    const buffer = Buffer.from(base64.replace(/\s+/g, ""), "base64");
    const targetFile = fileURLToPath(targetPath);
    await mkdir(dirname(targetFile), { recursive: true });
    await writeFile(targetFile, buffer);
    console.log("Generated ambient-space.mp3 from base64 payload");
  } catch (error) {
    console.error("Failed to generate ambient audio asset:", error);
    process.exitCode = 1;
  }
}

void main();
