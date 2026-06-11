# The Poisoned Invoice — design

**Date:** 2026-06-11 · **Target:** Ledger "Build & Show with the Agent Stack" bounty (college.xyz/bounties/38), deadline 2026-06-12 23:59 CET.

## Problem & story

AI agents that move money parse untrusted input (invoices, emails, web pages). A prompt-injection hidden in that input can silently rewrite a payment — and the agent's own terminal output will happily lie about it. The Ledger Agent Stack's answer: the transaction the device signs is the transaction the device *shows*, on a screen no software can repaint.

The demo: an accounts-payable agent pays three vendor invoices through a Ledger device (Speculos emulator). Invoice #3 carries a hidden injection redirecting payment to an attacker with an inflated "full treasury" amount. The two legit invoices are clear-signed and approved on-device; the drain is ex