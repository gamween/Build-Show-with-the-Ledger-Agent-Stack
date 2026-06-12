/**
 * Capture proof screenshots of the Ledger clear-signing the two invoices.
 * Writes PNGs of the real device screen to ./assets. Reproducible proof-of-use.
 *
 *   npm run capture
 */
import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";
import { Ledger } from "../src/ledger";
import { buildPayment } from "../src/tx";
import { parseInvoice } from "../src/agent";
import { Speculos } from "../src/screen";

const SPECULOS_URL = process.env.SPECULOS_URL ?? "http://localhost:5001";
const ASSETS = join(__dirname, "..", "assets");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function shot(name: string) {
  const res = await fetch(`${SPECULOS_URL}/screenshot`);
  writeFileSync(join(ASSETS, name), Buffer.from(await res.arrayBuffer()));
  console.log("  saved assets/" + name);
}

/** Poll (without pressing) until a screen matching `target` appears. */
async function waitFor(speculos: Speculos, target: RegExp, timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (target.test((await speculos.currentScreen()).join(" | "))) return;
    await sleep(250);
  }
  throw new Error(`waitFor: never reached ${target}`);
}

/** Press right until a screen matching `target` is shown; screenshot it. */
async function stepTo(speculos: Speculos, target: RegExp, png: string, max = 20) {
  for (let i = 0; i < max; i++) {
    const line = (await speculos.currentScreen()).join(" | ");
    if (target.test(line)) {
      await shot(png);
      return;
    }
    await speculos.press("right");
    await sleep(300);
  }
  throw new Error(`stepTo: never reached ${target}`);
}

interface Waypoint {
  re: RegExp;
  png: string;
}

async function captureInvoice(
  ledger: Ledger,
  speculos: Speculos,
  file: string,
  nonce: number,
  waypoints: Waypoint[],
  decision: "approve" | "reject",
  decisionPng: string,
) {
  const intent = parseInvoice(readFileSync(join(__dirname, "..", "invoices", file), "utf8"));
  const built = buildPayment(intent, nonce);

  // Start signing in the background; drive the screen in the foreground.
  const signing = ledger.signTransaction(built.bytes).catch(() => undefined);
  await waitFor(speculos, /review transaction|review to send/i);
  // Screenshot each review screen in the order it appears, then the decision.
  for (const w of waypoints) await stepTo(speculos, w.re, w.png);
  await stepTo(speculos, decision === "approve" ? /sign transaction/i : /reject/i, decisionPng);
  await speculos.press("both");
  await signing;
  await sleep(500);
}

async function main() {
  mkdirSync(ASSETS, { recursive: true });
  const ledger = await Ledger.connect(SPECULOS_URL);
  const speculos = new Speculos(SPECULOS_URL);

  console.log("Capturing device screenshots…");
  await shot("01-app-ready.png");

  console.log("clean invoice — full clear-signing flow, approved:");
  await captureInvoice(
    ledger,
    speculos,
    "invoice-clean.md",
    0,
    [
      { re: /review transaction/i, png: "06-review.png" },
      { re: /^amount/i, png: "07-amount.png" },
      { re: /^to\b/i, png: "02-clean-recipient.png" },
    ],
    "approve",
    "03-clean-sign.png",
  );

  console.log("poisoned invoice — recipient = attacker, rejected:");
  await captureInvoice(
    ledger,
    speculos,
    "invoice-poisoned.md",
    1,
    [{ re: /^to\b/i, png: "04-poisoned-recipient.png" }],
    "reject",
    "05-poisoned-reject.png",
  );

  await ledger.disconnect();
  console.log("Done. See ./assets");
  process.exit(0);
}

main().catch((e) => {
  console.error("capture failed:", e?.message ?? e);
  process.exit(1);
});
