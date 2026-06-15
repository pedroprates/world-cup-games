import fs from "fs/promises";
import path from "path";
import { FIXTURES } from "../lib/fixtures";

const OUTPUT = path.join(process.cwd(), "data", "fixtures.json");

async function seed() {
  await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
  await fs.writeFile(OUTPUT, JSON.stringify(FIXTURES, null, 2));
  console.log(`Seeded ${FIXTURES.length} fixtures → ${OUTPUT}`);
}

seed().catch(e => { console.error(e); process.exit(1); });
