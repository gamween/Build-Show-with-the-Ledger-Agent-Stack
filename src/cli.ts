/**
 * Pay a single invoice from the command line.
 *
 *   npm run pay -- invoices/invoice-clean.md \
 *     --expect 0xac3e1d4f5b6a7c8d9e0f1a2b3c4d5e6f70819203 [--llm]
 *
 * --expect is the payee you actually intend to pay (your address book). The
 * device screen is compared against it; mismatch is rejected on the hardware.
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { Ledger } from "./ledger";
import { pay } from "./pay";

const SPECULOS_URL = process.env.SPECULOS_URL ?? "http://localhost:5001";

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const file = process.argv[2];
  const expect = arg("--expect");
  const useLlm = process.argv.includes("--llm");

  if (!file || !expect) {
    console.error("usage: npm run pay -- <invoice.md> --expect <0xpayee> [--llm]");
    process.exit(2);
  }

  const invoiceText = readFileSync(resolve(file), "utf8");
  const ledger = await Ledger.connect(SPECULOS_URL);

  console.log(`Connected. Reviewing payment against expected payee ${expect}…`);
  const result = await pay({
    invoiceText,
    expectedPayee: expect,
    ledger,
    speculosUrl: SPECULOS_URL,
    extract: useLlm
      ? { useLlm: true, apiKey: process.env.ANTHROPIC_API_KEY, model: process.env.MODEL }
      : {},
  });

  console.log(`agent (${result.via}) prepared: ${result.intent.amountEth} ETH -> ${result.intent.to}`);
  console.log(`device displayed recipient: ${result.device.to ?? "—"}`);
  if (result.outcome === "signed") {
    console.log(`APPROVED. signature.r = ${result.signature.r}`);
    console.log(`recovered sender = ${result.signedFrom}`);
  } else {
    console.log(`REJECTED on device: ${result.reason}`);
  }

  await ledger.disconnect();
  process.exit(result.outcome === "signed" ? 0 : 1);
}

main().catch((err) => {
  console.error("Error:", err?.message ?? err);
  process.exit(1);
});
