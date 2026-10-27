/**
 * Add every liked link (data/liked.yml, oldest first) to the Are.na channel,
 * remembering what was already sent in data/synced_to_arena.yml.
 *
 * Requires ARENA_TOKEN (read from the environment or .env). With --dry-run it
 * only prints the links it would add and writes nothing.
 *
 *   deno run --allow-net=api.are.na --allow-read=.env,data \
 *     --allow-write=data/synced_to_arena.yml --allow-env flat/export-to-arena.ts [--dry-run]
 */

import "jsr:@std/dotenv@0.225/load";
import { parse, stringify } from "jsr:@std/yaml@1";

const CHANNEL_ID = 1977086;
const SYNCED_FILE = "data/synced_to_arena.yml";
const dryRun = Deno.args.includes("--dry-run");

const synced = parse(await Deno.readTextFile(SYNCED_FILE)) as (string | null)[];
const liked = parse(await Deno.readTextFile("data/liked.yml")) as { link: string }[];
const done = new Set(synced);

for (const { link } of liked.toReversed()) {
  if (done.has(link)) continue;
  if (dryRun) {
    console.log(`would add ${link}`);
    done.add(link);
    continue;
  }
  const url = `https://api.are.na/v2/channels/${CHANNEL_ID}/blocks?${new URLSearchParams({ source: link })}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("ARENA_TOKEN")}` },
  });
  const body = await res.text();
  if (res.status !== 200) {
    console.error(`✗ ${link}: ${res.status} ${body}`);
    continue;
  }
  console.log(`✓ ${link}`);
  synced.push(link);
  done.add(link);
}

if (!dryRun) await Deno.writeTextFile(SYNCED_FILE, stringify(synced));
