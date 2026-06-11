/**
 * Orchestrate one payment end-to-end.
 *
 * agent → transaction → device clear-signs → the "human" reads the trusted
 * display and compares the recipient it shows against the payee they actually
 * intended to pay (their address book), then approves or rejects ON the device.
 *
 * The approval decision is made from the device screen, never from what the
 * agent claims. That comparison is the whole point: What You See Is What You Sign.
 */
import { extractIntent, type ExtractOptions } from "./agent";
import { buildPayment, recoverSender } from "./tx";
import { Ledger } from "./ledger";
import { Speculos, readReview, confirm } from "./screen";
import { PaymentRejected, type DeviceView, type PaymentIntent, type Signature } from "./types";

export interface PayRequest {
  invoiceText: string;
  /** The payee the human actually intends to pay (their independent ground truth). */
  expectedPayee: string;
  ledger: Ledger;
  speculosUrl: string;
  nonce?: number;
  extract?: ExtractOptions;
}

export type PayResult =
  | {
      outcome: "signed";
      intent: PaymentIntent;
      via: "deterministic" | "llm";
      device: DeviceView;
      signature: Signature;
      signedFrom: string;
    }
  | {
      outcome: "rejected";
      intent: PaymentIntent;
      via: "deterministic" | "llm";
      device: DeviceView;
      reason: string;
    };

export async function pay(req: PayRequest): Promise<PayResult> {
  const { intent, via } = await extractIntent(req.invoiceText, req.extract);
  const built = buildPayment(intent, req.nonce ?? 0);
  const speculos = new Speculos(req.speculosUrl);
  const expected = req.expectedPayee.toLowerCase();

  // The "human": read the trusted display, compare to the intended payee, act.
  let observed: DeviceView = { to: null, amountEth: null, network: null };
  const human = (async () => {
    await waitForReview(speculos);
    const { device } = await readReview(speculos);
    observed = device;
    const matches = device.to !== null && device.to.toLowerCase() === expected;
    await confirm(speculos, matches ? /sign transaction|hold to sign|^accept|approve/i : /reject/i);
    return matches;
  })();

  // The device drives the signing flow; the human drives the buttons.
  try {
    const signature = await req.ledger.signTransaction(built.bytes);
    await human;
    return {
      outcome: "signed",
      intent,
      via,
      device: observed,
      signature,
      signedFrom: recoverSender(built, signature),
    };
  } catch (err) {
    await human.catch(() => undefined);
    if (err instanceof PaymentRejected) {
      return {
        outcome: "rejected",
        intent,
        via,
        device: observed,
        reason:
          observed.to && observed.to.toLowerCase() !== expected
            ? `device showed ${observed.to}, but the expected payee is ${req.expectedPayee}`
            : "rejected on device",
      };
    }
    throw err;
  }
}

async function waitForReview(speculos: Speculos, timeoutMs = 8000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const line = (await speculos.currentScreen()).join(" | ");
    if (/review transaction|review to send/i.test(line)) return;
    await sleep(250);
  }
  // Proceed anyway; readReview will navigate from wherever we are.
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
