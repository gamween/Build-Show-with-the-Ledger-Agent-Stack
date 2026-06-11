/**
 * The ONLY module that talks to the Ledger Device Management Kit.
 *
 * Wraps DMK + the Speculos transport behind three calls: connect, getAddress,
 * signTransaction. A device rejection is surfaced as a typed `PaymentRejected`
 * outcome (per the DMK guidance: "user rejection is not an error"), not a crash.
 */
import {
  DeviceManagementKitBuilder,
  DeviceActionStatus,
} from "@ledgerhq/device-management-kit";
import {
  speculosTransportFactory,
  speculosIdentifier,
} from "@ledgerhq/device-transport-kit-speculos";
import { SignerEthBuilder } from "@ledgerhq/device-signer-kit-ethereum";
import { firstValueFrom, filter, map, type Observable } from "rxjs";
import { LedgerUnavailable, PaymentRejected, type DeviceView, type Signature } from "./types";

/** Ledger Live derivation path for the first Ethereum account. */
export const ETH_PATH = "44'/60'/0'/0/0";

/** Device rejection status words (see DMK skill: rejection varies by signer). */
const REJECTION_CODES = new Set(["5501", "6985", "6982"]);

function isRejection(err: unknown): boolean {
  const e = err as { _tag?: string; errorCode?: string; originalError?: { errorCode?: string } };
  const tag = e?._tag ?? "";
  const code = e?.errorCode ?? e?.originalError?.errorCode ?? "";
  return tag === "RefusedByUserDAError" || REJECTION_CODES.has(code);
}

export class Ledger {
  private constructor(
    private readonly dmk: ReturnType<DeviceManagementKitBuilder["build"]>,
    private readonly sessionId: string,
  ) {}

  /** Discover and connect to the Speculos device over the HTTP transport. */
  static async connect(speculosUrl: string): Promise<Ledger> {
    const dmk = new DeviceManagementKitBuilder()
      .addTransport(speculosTransportFactory(speculosUrl))
      .build();
    let device;
    try {
      device = await firstValueFrom(dmk.startDiscovering({ transport: speculosIdentifier }));
    } catch {
      throw new LedgerUnavailable(
        `Could not reach a Ledger at ${speculosUrl}. Is Speculos running? Try: npm run speculos`,
      );
    }
    const sessionId = await dmk.connect({ device });
    return new Ledger(dmk, sessionId);
  }

  private signer() {
    return new SignerEthBuilder({ dmk: this.dmk, sessionId: this.sessionId } as never).build();
  }

  /** Derive the device's Ethereum address (no on-device prompt). */
  async getAddress(): Promise<string> {
    const { observable } = this.signer().getAddress(ETH_PATH, { checkOnDevice: false });
    const out = await this.await<{ address: string }>(observable);
    return out.address;
  }

  /**
   * Clear-sign an EIP-1559 transaction. Resolves with the signature on approval;
   * throws `PaymentRejected` if the user rejects on the device. The caller
   * attaches the values it read off the trusted display to the rejection.
   */
  async signTransaction(bytes: Uint8Array): Promise<Signature> {
    const { observable } = this.signer().signTransaction(ETH_PATH, bytes);
    try {
      return await this.await<Signature>(observable);
    } catch (err) {
      if (isRejection(err)) {
        const empty: DeviceView = { to: null, amountEth: null, network: null };
        throw new PaymentRejected("rejected on device", empty);
      }
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    await this.dmk.disconnect({ sessionId: this.sessionId });
  }

  /** Collapse a DMK device-action observable to its completed output (or throw its error). */
  private await<T>(observable: Observable<any>): Promise<T> {
    return firstValueFrom(
      observable.pipe(
        filter(
          (s: { status: DeviceActionStatus }) =>
            s.status === DeviceActionStatus.Completed || s.status === DeviceActionStatus.Error,
        ),
        map((s: { status: DeviceActionStatus; output?: unknown; error?: unknown }) => {
          if (s.status === DeviceActionStatus.Error) throw s.error;
          return s.output as T;
        }),
      ),
    );
  }
}
