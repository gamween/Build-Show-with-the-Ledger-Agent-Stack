/**
 * Shared types for the clear-signing agent.
 *
 * A `PaymentIntent` is what the (foolable) software layer produces from an
 * invoice. The hardware never trusts it: the device clear-signs the real
 * transaction and the human compares the device screen against their own
 * independent expectation.
 */

export interface PaymentIntent {
  /** Recipient address as the agent extracted it from the invoice. May be wrong. */
  to: string;
  /** Amount in ETH as a decimal string, e.g. "0.25". */
  amountEth: string;
  /** Chain id. 1 = mainnet, 11155111 = Sepolia. */
  chainId: number;
  /** Free-text memo / reference the agent read off the invoice (for display only). */
  memo: string;
}

export interface Signature {
  r: string;
  s: string;
  v: number;
}

/** What the Ledger screen actually displayed during clear-signing. */
export interface DeviceView {
  to: string | null;
  amountEth: string | null;
  network: string | null;
}

/** Thrown when the user rejects the transaction on the device. Not an error condition. */
export class PaymentRejected extends Error {
  constructor(
    public readonly reason: string,
    public readonly device: DeviceView,
  ) {
    super(`Payment rejected on device: ${reason}`);
    this.name = "PaymentRejected";
  }
}

/** Thrown when Speculos / the Ledger cannot be reached. */
export class LedgerUnavailable extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LedgerUnavailable";
  }
}
