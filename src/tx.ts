/**
 * Build an unsigned EIP-1559 transaction from a PaymentIntent, and recover the
 * sender from a finished signature. Pure ethers; no device involved.
 */
import { Transaction, getBytes, parseEther, parseUnits, getAddress } from "ethers";
import type { PaymentIntent, Signature } from "./types";

export interface BuiltTx {
  tx: Transaction;
  bytes: Uint8Array;
}

/**
 * Construct the unsigned transaction the device will be asked to clear-sign.
 * Gas fields are fixed, sensible defaults for a plain ETH transfer — the point
 * of the project is the recipient/amount the device displays, not fee tuning.
 */
export function buildPayment(intent: PaymentIntent, nonce = 0): BuiltTx {
  const tx = Transaction.from({
    type: 2,
    chainId: intent.chainId,
    nonce,
    to: getAddress(intent.to),
    value: parseEther(intent.amountEth),
    maxFeePerGas: parseUnits("20", "gwei"),
    maxPriorityFeePerGas: parseUnits("1", "gwei"),
    gasLimit: 21000n,
  });
  return { tx, bytes: getBytes(tx.unsignedSerialized) };
}

/** Attach a signature and return the recovered `from` address (lowercased). */
export function recoverSender(built: BuiltTx, sig: Signature): string {
  built.tx.signature = { r: sig.r, s: sig.s, v: sig.v };
  return (built.tx.from ?? "").toLowerCase();
}
