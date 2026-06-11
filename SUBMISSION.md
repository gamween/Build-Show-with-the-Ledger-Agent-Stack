# Submission — Build & Show with the Ledger Agent Stack

Everything you need to file the bounty. The build is done and verified; you just
need to publish a post and fill the form.

Bounty: https://www.college.xyz/bounties/38 · **Deadline: Fri June 12, 23:59 CET.**
Lane C — "Build Something Real" (repo + README + walkthrough).

---

## 1. Draft post (X / LinkedIn)

> ⚠️ Edit the **repo link** and the optional **video link** before posting. The
> `#LedgerSponsor` disclosure and the `@Ledger` tag are **required** — keep them.

**X / Twitter version:**

```
Give an AI agent an invoice to pay and you give it an attack surface: tamper with
the invoice, and a software-only agent signs a payment to the attacker. No human, no
kill switch.

So I built a treasury agent on @Ledger's Agent Stack where the device clear-signs the
real recipient. Same supplier, same amount — but a poisoned invoice swaps the payout
address. The agent gets fooled. The Ledger doesn't: it shows the attacker's address on
its trusted screen, and the payment is rejected on the hardware itself.

The agent can be lied to. Its Ledger can't. What You See Is What You Sign.

Software proposes. Hardware displays the truth. The human approves.

Ran it end-to-end on Speculos (Ledger's emulator) with the official Ethereum app — no
physical device needed.

Code: <YOUR_REPO_URL>

#LedgerSponsor (paid collaboration with @Ledger)
```

**LinkedIn version (same idea, a touch longer):**

```
AI agents that move money read untrusted inputs — invoices, emails, web pages. Any of
them can be tampered with, and a software-only agent will happily prepare a payment to
the wrong address. A private key in a .env file just signs it. No human in the loop, no
kill switch.

I built a treasury agent on Ledger's new open-source Agent Stack (Device Management Kit)
where the hardware is the last line of defense. The agent reads an invoice and prepares
an Ethereum payment. The Ledger clear-signs it — showing the REAL recipient on its
trusted screen — and a human approves on the device.

The demo: two invoices for the same supplier and amount. The poisoned one carries an
"updated remittance" note that swaps in an attacker's address (textbook invoice fraud).
The agent is fooled and prepares the attacker payment. But the Ledger surfaces the
attacker's address on-device, and it's rejected on the hardware. The clean invoice is
approved and signed.

The agent can be lied to. Its Ledger can't. What You See Is What You Sign.

Ran end-to-end on Speculos (Ledger's open-source emulator) with the official Ethereum
app — so it's fully reproducible without a physical device.

Code + walkthrough: <YOUR_REPO_URL>

#LedgerSponsor (paid collaboration with @Ledger)
```

---

## 2. Proof of use (attach to the post and the form)

Pick any of these — all are in the repo and reproducible:

- **Signing flow on screen:** `assets/02-clean-recipient.png` and
  `assets/04-poisoned-recipient.png` — the Ledger screen showing the real
  supplier vs. the attacker address, plus `assets/05-poisoned-reject.png`.
  Regenerate with `npm run capture`.
- **A short screen recording** of `npm run demo` (recommended for the post): it
  prints both scenarios and the contrast. Record your terminal + optionally the
  Speculos window.
- **The public repo** itself (DMK usage in `src/ledger.ts`, Speculos transport,
  the e2e test that signs and rejects).

The component used: **DMK** (Device Management Kit) via the Speculos transport.

---

## 3. Form checklist

File via the Google Form on the bounty page. Have ready:

- [ ] Link to your public post (X or LinkedIn)
- [ ] Component used: **DMK** (Device Management Kit)
- [ ] Proof of use: repo link + a screenshot/recording from `npm run demo` / `npm run capture`
- [ ] Your name, email, university
- [ ] Post tags **@Ledger** and includes a visible **#LedgerSponsor** disclosure
- [ ] Accept the T&Cs

---

## 4. Requirements this build meets

- ✅ Built with the Ledger Agent Stack (DMK + Speculos)
- ✅ Genuinely uses DMK — `src/ledger.ts` drives the device; the e2e test signs a
  real transaction and rejects a bad one (`npm test`)
- ✅ Emulator-based proof (Speculos), which the bounty accepts as valid
- ✅ Repo + README + walkthrough (Lane C)
- ⬜ Public post tagging @Ledger with #LedgerSponsor — **you publish this**
- ⬜ Form submitted before the deadline — **you do this**
