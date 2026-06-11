/**
 * Read the Ledger's trusted display through the Speculos HTTP API.
 *
 * The device screen is the only surface the human can trust. This module turns
 * the raw on-screen text into the values that were actually clear-signed:
 * recipient, amount, network. The recipient is shown split across several lines
 * (e.g. "0x5555763613a12D8F" / "3e73bE6DfC7F7948D" / "8c44BA1") — we stitch the
 * hex fragments back into one address.
 */
import type { DeviceView } from "./types";

export class Speculos {
  constructor(private readonly url: string) {}

  /** Text items currently on screen, in order. */
  async currentScreen(): Promise<string[]> {
    const res = await fetch(`${this.url}/events?currentscreenonly=true`);
    const { events } = (await res.json()) as { events: { text: string }[] };
    return events.map((e) => e.text);
  }

  /** Press a physical button: "left", "right", or "both". */
  async press(button: "left" | "right" | "both"): Promise<void> {
    await fetch(`${this.url}/button/${button}`, {
      method: "POST",
      body: JSON.stringify({ action: "press-and-release" }),
    });
  }
}

const HEX_FRAGMENT = /^(0x)?[0-9a-fA-F]{2,}$/;

/**
 * Walk the clear-signing review screens once, collecting the displayed fields.
 * Starts from "Review transaction" and steps right until the "Sign"/"Accept"
 * screen, accumulating From/To/Amount/Network. Returns the reconstructed
 * recipient view plus the ordered list of screen labels seen (so a caller can
 * navigate to the Sign or Reject screen afterwards).
 */
export async function readReview(
  speculos: Speculos,
  opts: { settleMs?: number; maxSteps?: number } = {},
): Promise<{ device: DeviceView; labels: string[] }> {
  const settleMs = opts.settleMs ?? 350;
  const maxSteps = opts.maxSteps ?? 24;
  const labels: string[] = [];

  let toFragments: string[] = [];
  let amountEth: string | null = null;
  let network: string | null = null;
  let collecting: "to" | null = null;

  for (let step = 0; step < maxSteps; step++) {
    await sleep(settleMs);
    const texts = await speculos.currentScreen();
    const line = texts.join(" | ");
    labels.push(line);

    // Field screens label the field on the first line, value on the rest.
    const head = (texts[0] ?? "").toLowerCase();
    const rest = texts.slice(1);

    if (head.startsWith("to")) {
      collecting = "to";
      toFragments = rest.filter((t) => HEX_FRAGMENT.test(t.trim()));
    } else if (head.startsWith("amount")) {
      collecting = null;
      amountEth = parseAmount(rest.join(" "));
    } else if (head.startsWith("network")) {
      collecting = null;
      network = rest.join(" ").trim() || null;
    } else if (collecting === "to") {
      // multi-screen address continuation
      toFragments.push(...texts.filter((t) => HEX_FRAGMENT.test(t.trim())));
    }

    if (/sign transaction|^accept|approve|hold to sign/i.test(line)) break;
    await speculos.press("right");
  }

  return {
    device: { to: stitchAddress(toFragments), amountEth, network },
    labels,
  };
}

/**
 * From the Sign/Reject region of the flow, navigate right until a screen
 * matching `target` is shown, then press both buttons to confirm it.
 */
export async function confirm(
  speculos: Speculos,
  target: RegExp,
  opts: { settleMs?: number; maxSteps?: number } = {},
): Promise<void> {
  const settleMs = opts.settleMs ?? 300;
  const maxSteps = opts.maxSteps ?? 16;
  for (let step = 0; step < maxSteps; step++) {
    const line = (await speculos.currentScreen()).join(" | ");
    if (target.test(line)) {
      await speculos.press("both");
      return;
    }
    await speculos.press("right");
    await sleep(settleMs);
  }
  throw new Error(`confirm: never reached a screen matching ${target}`);
}

function stitchAddress(fragments: string[]): string | null {
  if (fragments.length === 0) return null;
  const joined = fragments.map((f, i) => (i === 0 ? f : f.replace(/^0x/, ""))).join("");
  const hex = joined.startsWith("0x") ? joined : `0x${joined}`;
  return /^0x[0-9a-fA-F]{40}$/.test(hex) ? hex.toLowerCase() : hex.toLowerCase();
}

function parseAmount(text: string): string | null {
  const m = text.match(/([\d.]+)\s*ETH/i);
  return m ? m[1] : null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
