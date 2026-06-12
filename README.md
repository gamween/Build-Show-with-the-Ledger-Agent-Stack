# Ledger Clear-Sign Agent

![Ledger Clear-Sign Agent — field report](media/banner.png)

**An AI invoice-paying agent that can be lied to — and a Ledger that can't.**

Agents that move money read untrusted inputs: invoices, emails, web pages. Any
of them can be tampered with, and a compromised or prompt-injected agent will
happily prepare a payment to the wrong address. The defense that actually holds
is the Ledger's **trusted display**: it clear-signs the *real* recipient, and a
human compares what the device shows against who they actually meant to pay.

> Software proposes. The hardware displays the truth. The human approves on the device.

Built on [Ledger's Agent Stack](https://developers.ledger.com/docs/ai-tools/overview)
with the **Device Management Kit (DMK)**, running end-to-end on the **Speculos**
emulator — no physical device required. `#LedgerSponsor`

It is deliberately *not* the policy-engine pattern (spend caps + allowlists
enforced in software). The enforcement here is **What You See Is What You Sign**:
the recipient is verified on the hardware screen at signing time, so an agent
that gets fooled by its inputs still can't move funds to the wrong place.

---

## The demo, in one screen

Two invoices for the same supplier and amount. The only difference: the poisoned
one carries an "updated remittance" note that swaps in an attacker's address —
the textbook invoice-fraud move. The agent reads both and prepares a payment for
whatever the invoice says. The Ledger shows the truth.

![Method — the agent runs and the device clear-signs each payment](media/fig-method.png)

**Exhibit A — clean invoice.** The device shows the real supplier. Approved on
the device, and signed; the recovered sender is the device's own account.

![Exhibit A — clean invoice, approved on device](media/fig-clean.png)

**Exhibit B — poisoned invoice.** The agent is fooled into targeting an attacker.
The device clear-signing reveals the attacker address, and it is rejected on the
hardware. No signature is produced.

![Exhibit B — poisoned invoice, rejected on device](media/fig-poisoned.png)

```
Scenario 1 — clean invoice
  agent (deterministic) wants to pay : 0xac3e1d4f…70819203  (0.25 ETH)
  LEDGER SCREEN shows recipient   : 0xac3e1d4f…70819203
  expected supplier (address book): 0xac3e1d4f…70819203
  ✅ APPROVED on device — signed. recovered sender = 0xdad77910…baca6d8d

Scenario 2 — poisoned invoice
  agent (deterministic) wants to pay : 0xbad000c0…567890ff  (0.25 ETH)
  LEDGER SCREEN shows recipient   : 0xbad000c0…567890ff
  expected supplier (address book): 0xac3e1d4f…70819203
  ⛔ REJECTED on device — device showed 0xbad000c0…, expected 0xac3e1d4f…
     no signature produced. funds safe.
```

An agent holding a private key in a `.env` file would have signed and broadcast
the poisoned payment with no human in the loop.

---

## Proof — the clear-signing flow on the device

Real screenshots of the Speculos device during signing — the DMK signing flow on
screen. Regenerate any time with `npm run capture`.

**Clean invoice — the full clear-signing review:**

| Review | Amount | To (supplier) | Sign |
| :---: | :---: | :---: | :---: |
| ![review](assets/06-review.png) | ![amount](assets/07-amount.png) | ![to supplier](assets/02-clean-recipient.png) | ![sign](assets/03-clean-sign.png) |

**Poisoned invoice — the device reveals the attacker:**

| To (attacker) | Rejected |
| :---: | :---: |
| ![to attacker](assets/04-poisoned-recipient.png) | ![rejected](assets/05-poisoned-reject.png) |

A ~30-second walkthrough video (same field-report identity as this page) lives in
[`video/`](video) — render it with `cd video && npm run render`
(→ `video/out/clearsign-agent.mp4`).

---

## How it works

```
NL request + invoice.md
  └─ agent        extract { to, amount, network }      ← the foolable software
       └─ tx      build an EIP-1559 transaction (ethers)
            └─ ledger   DMK → Speculos → Ethereum app clear-signs
                 ├─ screen   read the device-displayed recipient/amount/network
                 └─ human    compare device recipient vs the intended payee
                      ├─ match    → approve on device → signature
                      └─ mismatch → reject on device  → funds safe
```

The approval decision is made from the **device screen**, never from what the
agent claims it's paying. That comparison is the entire security property.

Each module has one job:

| File | Responsibility |
| --- | --- |
| `src/agent.ts` | Extract a payment from an invoice (deterministic parser, or a real Claude agent with `--llm`). This is the layer an attacker fools. |
| `src/tx.ts` | Build the unsigned EIP-1559 transaction; recover the sender from a signature. |
| `src/ledger.ts` | The only module that talks to DMK + Speculos: connect, get address, clear-sign. Surfaces a device rejection as a typed outcome, not a crash. |
| `src/screen.ts` | Read the Ledger's trusted display through the Speculos HTTP API; stitch the on-screen address fragments back into one address. |
| `src/pay.ts` | Orchestrate one payment; compare the device screen against the intended payee; approve or reject on the hardware. |
| `src/demo.ts` / `src/cli.ts` | The two-scenario demo, and a one-invoice CLI. |

---

## Quickstart

**Prerequisites:** Node 20+ and Docker (for the Speculos emulator).

```bash
npm install
npm run setup        # download the official Ledger Ethereum app ELF (Nano X)
npm run speculos     # start the Speculos emulator on http://localhost:5001
npm run demo         # run both scenarios end-to-end
```

> macOS note: the emulator is exposed on port **5001** because macOS's AirPlay
> Receiver holds port 5000. Override with `SPECULOS_PORT` / `SPECULOS_URL`.

Other entry points:

```bash
npm test             # unit tests + an end-to-end proof against Speculos
npm run capture      # write proof screenshots of the device to ./assets
npm run speculos:logs
npm run speculos:stop

# Pay a single invoice; --expect is the payee YOU intend to pay (your address book)
npm run pay -- invoices/invoice-clean.md    --expect 0xac3e1d4f5b6a7c8d9e0f1a2b3c4d5e6f70819203
npm run pay -- invoices/invoice-poisoned.md --expect 0xac3e1d4f5b6a7c8d9e0f1a2b3c4d5e6f70819203
```

The end-to-end test proves the guardrail: a clean invoice yields a valid
signature whose recovered sender equals the device's own account, and the
poisoned invoice is rejected on the device with no signature produced. It skips
itself automatically if Speculos isn't running, so `npm test` stays green
without hardware.

---

## The agent: deterministic vs. real Claude

The point of the project is the hardware defense, so the **default agent is
deterministic** — fully reproducible, no API key, and what the tests use. The
poisoned invoice fools it the same way it would fool any naive invoice-payer:
it pays the latest beneficiary the document names.

A real-LLM mode demonstrates the same wiring with an actual agent:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
npm run demo -- --llm        # agent extraction runs through Claude (tool use)
```

In `--llm` mode the agent uses Claude (default `claude-opus-4-8`, override with
`MODEL`) with a `prepare_payment` tool, against the same poisoned invoice — whose
"updated remittance" note is a textbook prompt injection. Whether or not the
model is fooled, **the device defense is identical**: the recipient is verified
on the Ledger screen, not in software.

---

## Why DMK + Speculos (and not the Wallet CLI)

The [Wallet CLI](https://github.com/LedgerHQ/agent-skills) is USB-only and has no
Speculos transport, so for an emulator-based, fully reproducible build the right
primitive is **DMK** with its
[`@ledgerhq/device-transport-kit-speculos`](https://www.npmjs.com/package/@ledgerhq/device-transport-kit-speculos)
transport. The signing app is the **official, Ledger-published Ethereum app
build** (`app-ethereum` v1.22.1), downloaded from GitHub releases — not a
custom build. Emulator-based submissions count as valid proof-of-use for the
bounty.

---

## Scope

In: a single chain (Ethereum), the two scenarios, the deterministic + optional
Claude agent, Speculos via Docker. By default the signed transaction is printed
and its sender is recovered for verification — no funds move and no testnet
credentials are needed. The security property is the clear-signing comparison,
nothing more elaborate.

---

## License

MIT. The Ledger app ELF downloaded by `npm run setup` is Ledger's, under its own
license.
