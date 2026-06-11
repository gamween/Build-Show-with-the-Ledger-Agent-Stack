/**
 * The agent is *supposed* to be foolable — that is the premise. These tests
 * pin that behavior: a clean invoice yields the real supplier, a poisoned one
 * yields the attacker. The defense is downstream, on the device (see e2e.test).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { parseInvoice } from "../src/agent";

const SUPPLIER = "0xac3e1d4f5b6a7c8d9e0f1a2b3c4d5e6f70819203";
const ATTACKER = "0xbad000c0ffee1234567890abcdef1234567890ff";

function load(name: string): string {
  return readFileSync(join(__dirname, "..", "invoices", name), "utf8");
}

describe("invoice agent (deterministic)", () => {
  it("pays the real supplier from a clean invoice", () => {
    const intent = parseInvoice(load("invoice-clean.md"));
    expect(intent.to.toLowerCase()).toBe(SUPPLIER);
    expect(intent.amountEth).toBe("0.25");
    expect(intent.chainId).toBe(1);
  });

  it("is fooled by the poisoned invoice into targeting the attacker", () => {
    const intent = parseInvoice(load("invoice-poisoned.md"));
    // This is the vulnerability the project exists to neutralize: the software
    // happily prepares a payment to the attacker. The device catches it.
    expect(intent.to.toLowerCase()).toBe(ATTACKER);
    expect(intent.amountEth).toBe("0.25");
  });
});
