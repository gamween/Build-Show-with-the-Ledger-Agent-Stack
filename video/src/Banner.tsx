import React from "react";
import { AbsoluteFill } from "remotion";

/* Static README hero banner — same "audit field report" identity as Demo. */
const P = {
  paper: "#E6E8E5",
  rule: "#D2D5CF",
  ink: "#15181A",
  inkDim: "#5D625E",
  indigo: "#27345C",
  red: "#A8392C",
};
const SANS = '"SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif';
const MONO = '"SF Mono", ui-monospace, "JetBrains Mono", Menlo, monospace';

export const Banner: React.FC = () => (
  <AbsoluteFill style={{ background: P.paper }}>
    <AbsoluteFill
      style={{
        backgroundImage: `repeating-linear-gradient(${P.paper}, ${P.paper} 59px, ${P.rule} 59px, ${P.rule} 60px)`,
        opacity: 0.5,
      }}
    />
    {/* header */}
    <div style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          padding: "54px 90px 22px",
          fontFamily: MONO,
          color: P.inkDim,
          fontSize: 24,
          letterSpacing: 2,
        }}
      >
        <span style={{ color: P.ink, fontWeight: 600 }}>
          CLEAR-SIGN AGENT
          <span style={{ color: P.inkDim, fontWeight: 400 }}> · field report</span>
        </span>
        <span>LEDGER AGENT STACK · DMK + SPECULOS</span>
      </div>
      <div style={{ height: 2, background: P.ink, margin: "0 90px" }} />
    </div>

    {/* title */}
    <AbsoluteFill style={{ justifyContent: "center", padding: "0 90px" }}>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 22,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: P.indigo,
          borderLeft: `3px solid ${P.indigo}`,
          paddingLeft: 14,
          marginBottom: 30,
        }}
      >
        WYSIWYS — what you see is what you sign
      </div>
      <div style={{ fontFamily: SANS, fontSize: 92, fontWeight: 800, color: P.ink, lineHeight: 1.04 }}>
        The agent can be lied to. <span style={{ color: P.red }}>Its Ledger can&rsquo;t.</span>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 28, color: P.inkDim, marginTop: 26 }}>
        An AI invoice-paying agent · the recipient is clear-signed on hardware.
      </div>
    </AbsoluteFill>

    {/* footer */}
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
      <div style={{ height: 1, background: P.rule, margin: "0 90px" }} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "20px 90px 40px",
          fontFamily: MONO,
          fontSize: 22,
          color: P.inkDim,
          letterSpacing: 1,
        }}
      >
        <span>github.com/gamween/Build-Show-with-the-Ledger-Agent-Stack</span>
        <span style={{ color: P.red, letterSpacing: 3 }}>#LedgerSponsor · paid collaboration with @Ledger</span>
      </div>
    </div>
  </AbsoluteFill>
);
