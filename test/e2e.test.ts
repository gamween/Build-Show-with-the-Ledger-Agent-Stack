/**
 * End-to-end proof that the guardrail works, against a running Speculos device.
 *
 *   clean invoice    -> a valid signature whose recovered sender is the device
 *   poisoned invoice -> rejected on the device, no signature
 *
 * Requires Speculos: `npm run setup && npm run speculos`. Skipped automatically
 * if the device is not reachable, so `npm test` stays green without hardware.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { Ledger } from "../src/ledger";
import { pay } from "../src/pay";

const SPECULOS_URL = process.env.SPECULOS_URL ?? "http://localhost:5001";
const SUPPLIER = "0xac3e1d4f5b6a7c8d9e0f1a2b3c4d5e6f70819203";

function load(name: string): string {
  return readFileSync(join(__dirname, "..", "invoices", name), "utf8");
}

async function speculosUp(): Promise<boolean> {
  try {
    const res = await fetch(`${SPECULOS_URL}/events?currentscreenonly=true`, {
      signal: AbortSignal.timeout(1500),
    });
    return res.ok;
  } catch {
    return false;
  }
}

describe("clear-signing guardrail (Speculos)", () => {
  let ledger: Ledger | null = null;
  let available = false;

  beforeAll(async () => {
    available = await speculosUp();
    if (available) ledger = await Ledger.connect(SPECULOS_URL);
  }, 30_000);

  afterAll(async () => {
    if (ledger) await ledger.disconnect();
  });

  it("signs a clean invoice; recovered sender is the device account", async () => {
    if (!available || !ledger) return; // skipped without Speculos
    const deviceAddr = (await ledger.getAddress()).toLowerCase();

    const result = await pay({
      invoiceText: load("invoice-clean.md"),
      expectedPayee: SUPPLIER,
      ledger,
      speculosUrl: SPECULOS_URL,
      nonce: 0,
    });

    expect(result.outcome).toBe("signed");
    if (result.outcome === "signed") {
      expect(result.device.to).toBe(SUPPLIER);
      expect(result.signedFrom).toBe(deviceAddr);
    }
  }, 60_000);

  it("rejects the poisoned invoice on the device; no signature", async () => {
    if (!available || !ledger) return; // skipped without Speculos
    const result = await pay({
      invoiceText: load("invoice-poisoned.md"),
      expectedPayee: SUPPLIER,
      ledger,
      speculosUrl: SPECULOS_URL,
      nonce: 1,
    });

    expect(result.outcome).toBe("rejected");
    if (result.outcome === "rejected") {
      // The device showed the attacker, which is not the expected supplier.
      expect(result.device.to).not.toBe(SUPPLIER);
    }
  }, 60_000);
});
