/**
 * The "AI agent" / intent layer — the foolable software.
 *
 * It reads an invoice and produces a PaymentIntent: who to pay, how much, on
 * which network. This is exactly the layer an attacker targets. A tampered
 * invoice makes the agent prepare a payment to the wrong recipient — and
 * nothing here can catch that, by design. The Ledger does, downstream.
 *
 * Two modes:
 *  - deterministic (default): a parser that pays whoever the invoice's latest
 *    remittance line names. Reproducible; used by the tests and the demo.
 *  - llm (--llm, needs ANTHROPIC_API_KEY): a real Claude agent using tool use.
 *    Same wiring, a real model. The device defense is identical either way.
 */
import type { PaymentIntent } from "./types";

export interface ExtractOptions {
  useLlm?: boolean;
  apiKey?: string;
  model?: string;
}

export async function extractIntent(
  invoiceText: string,
  opts: ExtractOptions = {},
): Promise<{ intent: PaymentIntent; via: "deterministic" | "llm" }> {
  if (opts.useLlm) {
    if (!opts.apiKey) {
      throw new Error("--llm mode needs ANTHROPIC_API_KEY (see .env.example).");
    }
    return { intent: await extractWithClaude(invoiceText, opts), via: "llm" };
  }
  return { intent: parseInvoice(invoiceText), via: "deterministic" };
}

// --- Deterministic parser ---------------------------------------------------

/**
 * A naive invoice payer: it pays the beneficiary the invoice names. When an
 * invoice carries an "updated remittance" directive, the latest one wins — the
 * behavior business-payment automation actually has, and the exact behavior
 * invoice-fraud ("business email compromise") abuses.
 */
export function parseInvoice(text: string): PaymentIntent {
  const to = lastMatch(text, /(?:beneficiary address|pay to|remit to)[:*\-\s]*(0x[0-9a-fA-F]{40})/gi);
  if (!to) throw new Error("agent: no beneficiary address found in invoice");

  const amountEth = firstMatch(text, /amount\s+due[:*\-\s]*([\d.]+)\s*ETH/i)
    ?? firstMatch(text, /([\d.]+)\s*ETH/i);
  if (!amountEth) throw new Error("agent: no ETH amount found in invoice");

  const chainId = /sepolia/i.test(text) ? 11155111 : 1;
  const memo = firstMatch(text, /invoice\s+(?:no\.?|number|#)?\s*([A-Za-z0-9\-]+)/i) ?? "payment";

  return { to, amountEth, chainId, memo };
}

// --- Real Claude agent (optional) ------------------------------------------

const PREPARE_PAYMENT_TOOL = {
  name: "prepare_payment",
  description: "Prepare the on-chain payment that settles this invoice.",
  input_schema: {
    type: "object" as const,
    properties: {
      to: { type: "string", description: "Beneficiary 0x address to pay" },
      amount_eth: { type: "string", description: "Amount in ETH, decimal string" },
      network: { type: "string", enum: ["mainnet", "sepolia"] },
      memo: { type: "string", description: "Invoice reference" },
    },
    required: ["to", "amount_eth", "network", "memo"],
  },
};

async function extractWithClaude(invoiceText: string, opts: ExtractOptions): Promise<PaymentIntent> {
  // Lazy import so the project runs without the optional dependency installed.
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: opts.apiKey });

  const response = await client.messages.create({
    model: opts.model ?? "claude-opus-4-8",
    max_tokens: 1024,
    tools: [PREPARE_PAYMENT_TOOL],
    tool_choice: { type: "tool", name: "prepare_payment" },
    messages: [
      {
        role: "user",
        content:
          "You are a treasury assistant that settles supplier invoices. " +
          "Read the invoice below and call prepare_payment with the details it should be paid by.\n\n" +
          "----- INVOICE -----\n" +
          invoiceText,
      },
    ],
  });

  const call = response.content.find((b) => b.type === "tool_use");
  if (!call || call.type !== "tool_use") {
    throw new Error("agent(llm): model did not call prepare_payment");
  }
  const input = call.input as { to: string; amount_eth: string; network: string; memo: string };
  return {
    to: input.to,
    amountEth: input.amount_eth,
    chainId: /sepolia/i.test(input.network) ? 11155111 : 1,
    memo: input.memo,
  };
}

// --- helpers ----------------------------------------------------------------

function firstMatch(text: string, re: RegExp): string | null {
  const m = text.match(re);
  return m ? m[1] : null;
}

function lastMatch(text: string, reGlobal: RegExp): string | null {
  let last: string | null = null;
  for (const m of text.matchAll(reGlobal)) last = m[1];
  return last;
}
