// AI-assisted: see AI-ATTRIBUTION.md
import { Buffer } from "node:buffer";
import process from "node:process";
import { open, rm } from "node:fs/promises";
import bcrypt from "bcryptjs";
import { loadAWSConfig } from "../config/AWSConfig";
import { AWSDAOFactory } from "../model/dao/aws/AWSDAOFactory";
import { buildMilestone4Fixtures } from "./milestone4Fixtures";
import { seedMilestone4 } from "./seedMilestone4";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let namespace = "";
  let output = "";
  let write = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--write" && !write) write = true;
    else if (args[i] === "--namespace" && !namespace && args[i + 1] && !args[i + 1].startsWith("--")) namespace = args[++i];
    else if (args[i] === "--output" && !output && args[i + 1] && !args[i + 1].startsWith("--")) output = args[++i];
    else throw new Error("Usage: --namespace <6-24 lowercase letters/digits> [--write --output <new manifest path>]");
  }
  const plan = buildMilestone4Fixtures(namespace, "https://example.com/dry-run.png");
  if (!write) {
    if (output) throw new Error("--output requires --write; a dry run creates no manifest.");
    console.log(JSON.stringify({ mode: "dry-run", namespace, aliases: Object.values(plan.users).map((u) => u.alias),
      users: 4, followRelationships: 2, storyEntries: 26, feedEntries: 26, images: 1 }, null, 2));
    return;
  }
  if (!output) throw new Error("--write requires --output for the generated fixture manifest.");
  const password = process.env.TWEETER_TEST_PASSWORD;
  if (!password || password.trim().length === 0 || bcrypt.truncates(password)) throw new Error("TWEETER_TEST_PASSWORD must contain 1-72 UTF-8 bytes.");
  const config = loadAWSConfig();
  // Reserve the output before mutations, and never overwrite an existing file.
  const file = await open(output, "wx", 0o600);
  let completed = false;
  try {
    const fixtures = await seedMilestone4(new AWSDAOFactory(config), namespace, () => bcrypt.hash(password, 12),
      Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNQaLgAAAI0AXFUk8N2AAAAAElFTkSuQmCC", "base64"));
    await file.writeFile(JSON.stringify(fixtures, null, 2) + "\n");
    completed = true;
    console.log(`Created fixture manifest at ${output}. No passwords or tokens are included.`);
  } finally {
    await file.close();
    if (!completed) await rm(output, { force: true });
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Fixture seed failed.");
  process.exitCode = 1;
});
