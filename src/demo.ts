/**
 * The demo: two invoices, one Ledger, one contrast.
 *
 *   1. a clean invoice  -> the device shows the expected supplier -> approved
 *   2. a poisoned invoice -> the device shows an attacker address -> rejected
 *
 * Software proposes. The hardware displays the truth. The human approves on
 * the device. A key in a .env file would have signed both, silently.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { Ledger } from "./ledger";
import { pay, type PayResult } from "./pay";

const SPECULOS_URL = process.env.SPECULOS_URL ?? "http://localhost:5001";

// The treasury's address book: the *real*, independently-known supplier address.
// This is the human's ground truth — it is NOT read from the invoice.
const EXPECTED_SUPPLIER = "0xac3e1d4f5b6a7c8d9e0f1a2b3c4d5e6f70819203";

const useLlm = process.argv.includes("--llm");

function short(addr: string | null): string {
  if (!addr) return "—";
  return `${addr.slice(0, 10)}…${addr.slice(-8)}`;
}

function banner(title: string) {
  console.log("\n" + "─".repeat(64));
  console.log(title);
  console.log("─".repeat(64));
}

async function runScenario(
  ledger: Ledger,
  label: string,
  file: string,
  nonce: number,
): Promise<PayResult> {
  banner(label);
  const invoiceText = readFileSync(join(__dirname, "..", "invoices", file), "utf8");
  console.log(`Agent reads ${file} and prepares a payment…`);

  const result = await pay({
    invoiceText,
    expectedPayee: EXPECTED_SUPPLIER,
    ledger,
    speculosUrl: SPECULOS_URL,
    nonce,
    extract: useLlm
      ? { useLlm: true, apiKey: process.env.ANTHROPIC_API_KEY, model: process.env.MODEL }
      : {},
  });

  console.log(`  agent (${result.via}) wants to pay : ${short(result.intent.to)}  (${result.intent.amountEth} ETH)`);
  console.log(`  LEDGER SCREEN shows recipient   : ${short(result.device.to)}`);
  console.log(`  expected supplier (address book): ${short(EXPECTED_SUPPLIER)}`);

  if (result.outcome === "signed") {
    console.log(`  ✅ APPROVED on device — signed. recovered sender = ${short(result.signedFrom)}`);
  } else {
    console.log(`  ⛔ REJECTED on device — ${result.reason}`);
    console.log(`     no signature produced. funds safe.`);
  }
  return result;
}

async function main() {
  console.log("Ledger Clear-Sign Agent — WYSIWYS demo");
  console.log(`mode: ${useLlm ? "real Claude agent (--llm)" : "deterministic agent"}`);

  const ledger = await Ledger.connect(SPECULOS_URL);
  const treasury = await ledger.getAddress();
  console.log(`Treasury Ledger account (the sender): ${treasury}`);

  // Sequentially — never two device commands at once.
  const clean = await runScenario(ledger, "Scenario 1 — clean invoice", "invoice-clean.md", 0);
  const poisoned = await runScenario(ledger, "Scenario 2 — poisoned invoice", "invoice-poisoned.md", 1);

  banner("Result");
  console.log(`clean invoice    → ${clean.outcome.toUpperCase()}`);
  console.log(`poisoned invoice → ${poisoned.outcome.toUpperCase()}`);
  console.log("");
  console.log("The agent was willing to pay the attacker on the poisoned invoice.");
  console.log("The Ledger clear-signing surfaced the real recipient, and it was");
  console.log("rejected on the hardware itself. An agent holding a key in a .env");
  console.log("file would have signed and broadcast that payment with no human in");
  console.log("the loop.");
  console.log("\nSoftware proposes. Hardware displays the truth. The human approves.");

  await ledger.disconnect();

  const ok = clean.outcome === "signed" && poisoned.outcome === "rejected";
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error("\nDemo failed:", err?.message ?? err);
  console.error("Is Speculos running? Start it with: npm run speculos");
  process.exit(1);
});
