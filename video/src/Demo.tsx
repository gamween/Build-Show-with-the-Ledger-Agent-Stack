import React from "react";
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/* ── brand ──────────────────────────────────────────────────────────── */
const C = {
  bg: "#0A0A0B",
  surface: "#141418",
  surface2: "#1C1C22",
  line: "#2B2B33",
  text: "#FFFFFF",
  dim: "#8A8A95",
  green: "#2ED16A",
  orange: "#FF4E16",
};
const SANS =
  '"SF Pro Display", "Helvetica Neue", system-ui, -apple-system, sans-serif';
const MONO = '"SF Mono", ui-monospace, "JetBrains Mono", monospace';

const SUPPLIER = "0xAC3e1D4f…70819203";
const ATTACKER = "0xBaD000C0FFeE…7890ff";
const REPO = "github.com/gamween/Build-Show-with-the-Ledger-Agent-Stack";

/* ── small helpers ──────────────────────────────────────────────────── */

/** Fade a scene in over its first `pad` frames and out over its last `pad`. */
const Scene: React.FC<{ children: React.ReactNode; pad?: number }> = ({
  children,
  pad = 14,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity = interpolate(
    frame,
    [0, pad, durationInFrames - pad, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

const useRise = (delay = 0, distance = 26) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  return {
    opacity: interpolate(s, [0, 1], [0, 1]),
    transform: `translateY(${interpolate(s, [0, 1], [distance, 0])}px)`,
  };
};

const Rise: React.FC<{
  delay?: number;
  distance?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay = 0, distance, children, style }) => (
  <div style={{ ...useRise(delay, distance), ...style }}>{children}</div>
);

const Kicker: React.FC<{ children: React.ReactNode; color?: string }> = ({
  children,
  color = C.dim,
}) => (
  <div
    style={{
      fontFamily: MONO,
      fontSize: 26,
      letterSpacing: 6,
      textTransform: "uppercase",
      color,
    }}
  >
    {children}
  </div>
);

/** A pixelated emulator screenshot inside a device frame. */
const Device: React.FC<{ src: string; glow: string }> = ({ src, glow }) => {
  return (
    <div
      style={{
        background: "#000",
        borderRadius: 26,
        border: `1px solid ${C.line}`,
        padding: 26,
        width: 560,
        boxShadow: `0 0 80px ${glow}33`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div
          style={{ width: 12, height: 12, borderRadius: 6, background: glow }}
        />
        <span style={{ fontFamily: MONO, fontSize: 20, color: C.dim }}>
          Ledger · Speculos
        </span>
      </div>
      <Img
        src={src}
        style={{
          width: "100%",
          imageRendering: "pixelated",
          borderRadius: 8,
          display: "block",
        }}
      />
    </div>
  );
};

const Badge: React.FC<{ color: string; label: string; sub: string }> = ({
  color,
  label,
  sub,
}) => (
  <div
    style={{
      marginTop: 30,
      display: "inline-flex",
      flexDirection: "column",
      gap: 6,
      padding: "20px 30px",
      borderRadius: 16,
      background: `${color}1A`,
      border: `1px solid ${color}`,
    }}
  >
    <span
      style={{
        fontFamily: SANS,
        fontSize: 34,
        fontWeight: 700,
        color,
        letterSpacing: 1,
      }}
    >
      {label}
    </span>
    <span style={{ fontFamily: MONO, fontSize: 22, color: C.dim }}>{sub}</span>
  </div>
);

const Center: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill
    style={{
      justifyContent: "center",
      alignItems: "center",
      padding: 120,
      textAlign: "center",
    }}
  >
    {children}
  </AbsoluteFill>
);

/* ── scenes ─────────────────────────────────────────────────────────── */

const Intro: React.FC = () => (
  <Scene>
    <Center>
      <Rise delay={0}>
        <Kicker color={C.orange}>Ledger Agent Stack · DMK + Speculos</Kicker>
      </Rise>
      <Rise delay={10} style={{ marginTop: 40 }}>
        <div style={{ fontFamily: SANS, fontSize: 96, fontWeight: 700, color: C.text, lineHeight: 1.05 }}>
          The agent can be lied to.
        </div>
      </Rise>
      <Rise delay={26} style={{ marginTop: 10 }}>
        <div style={{ fontFamily: SANS, fontSize: 96, fontWeight: 700, color: C.orange, lineHeight: 1.05 }}>
          Its Ledger can&rsquo;t.
        </div>
      </Rise>
      <Rise delay={48} style={{ marginTop: 44 }}>
        <div style={{ fontFamily: MONO, fontSize: 30, color: C.dim }}>
          an AI invoice-paying agent · clear-signed on hardware
        </div>
      </Rise>
    </Center>
  </Scene>
);

const Pipe: React.FC<{ label: string; delay: number; accent?: string }> = ({
  label,
  delay,
  accent = C.text,
}) => (
  <Rise delay={delay}>
    <div
      style={{
        fontFamily: MONO,
        fontSize: 30,
        color: accent,
        background: C.surface,
        border: `1px solid ${C.line}`,
        borderRadius: 14,
        padding: "24px 34px",
      }}
    >
      {label}
    </div>
  </Rise>
);

const Arrow: React.FC<{ delay: number }> = ({ delay }) => (
  <Rise delay={delay} distance={0}>
    <div style={{ fontFamily: SANS, fontSize: 40, color: C.dim, margin: "0 22px" }}>→</div>
  </Rise>
);

const Explainer: React.FC = () => (
  <Scene>
    <Center>
      <Rise delay={0}>
        <Kicker>How it works</Kicker>
      </Rise>
      <div
        style={{
          marginTop: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Pipe label="invoice" delay={8} />
        <Arrow delay={16} />
        <Pipe label="AI agent" delay={22} />
        <Arrow delay={30} />
        <Pipe label="Ledger" delay={36} accent={C.orange} />
        <Arrow delay={44} />
        <Pipe label="human approves" delay={50} />
      </div>
      <Rise delay={64} style={{ marginTop: 64 }}>
        <div style={{ fontFamily: SANS, fontSize: 40, color: C.dim }}>
          The agent <span style={{ color: C.text }}>proposes</span>. The device
          shows the <span style={{ color: C.text }}>truth</span>. You{" "}
          <span style={{ color: C.text }}>approve</span> on the hardware.
        </div>
      </Rise>
    </Center>
  </Scene>
);

const InvoiceCard: React.FC<{
  poisoned?: boolean;
}> = ({ poisoned }) => (
  <div
    style={{
      width: 640,
      background: C.surface,
      border: `1px solid ${C.line}`,
      borderRadius: 22,
      padding: 40,
      fontFamily: SANS,
    }}
  >
    <div style={{ fontSize: 30, color: C.dim, marginBottom: 18 }}>
      invoice-{poisoned ? "poisoned" : "clean"}.md
    </div>
    <div style={{ fontSize: 40, fontWeight: 700, color: C.text }}>
      Invoice INV-2026-0481
    </div>
    <Row k="From" v="ACME Studios Ltd" />
    <Row k="Amount due" v="0.25 ETH" />
    <Row k="Beneficiary" v={SUPPLIER} mono />
    {poisoned && (
      <div
        style={{
          marginTop: 24,
          padding: 24,
          borderRadius: 14,
          background: `${C.orange}14`,
          border: `1px solid ${C.orange}`,
        }}
      >
        <div style={{ fontFamily: MONO, fontSize: 22, color: C.orange, letterSpacing: 2 }}>
          ⚠ REMITTANCE UPDATE — “use our new address”
        </div>
        <div style={{ fontFamily: MONO, fontSize: 28, color: C.text, marginTop: 12 }}>
          {ATTACKER}
        </div>
      </div>
    )}
  </div>
);

const Row: React.FC<{ k: string; v: string; mono?: boolean }> = ({ k, v, mono }) => (
  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
    <span style={{ fontSize: 30, color: C.dim }}>{k}</span>
    <span style={{ fontSize: 30, color: C.text, fontFamily: mono ? MONO : SANS }}>{v}</span>
  </div>
);

const ScenarioLayout: React.FC<{
  tag: string;
  tagColor: string;
  poisoned?: boolean;
  deviceSrc: string;
  deviceGlow: string;
  caption: React.ReactNode;
  badge: React.ReactNode;
}> = ({ tag, tagColor, poisoned, deviceSrc, deviceGlow, caption, badge }) => (
  <Scene>
    <AbsoluteFill style={{ padding: "90px 120px" }}>
      <Rise delay={0}>
        <Kicker color={tagColor}>{tag}</Kicker>
      </Rise>
      <div
        style={{
          marginTop: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 60,
        }}
      >
        <Rise delay={8}>
          <InvoiceCard poisoned={poisoned} />
        </Rise>
        <Rise delay={20} distance={0}>
          <div style={{ fontFamily: SANS, fontSize: 56, color: C.dim }}>→</div>
        </Rise>
        <Rise delay={30}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <Device src={deviceSrc} glow={deviceGlow} />
            <div style={{ marginTop: 22, fontFamily: SANS, fontSize: 30, color: C.dim }}>
              {caption}
            </div>
            <Rise delay={48} distance={14}>
              {badge}
            </Rise>
          </div>
        </Rise>
      </div>
    </AbsoluteFill>
  </Scene>
);

const Clean: React.FC = () => (
  <ScenarioLayout
    tag="Scenario 1 — clean invoice"
    tagColor={C.green}
    deviceSrc={staticFile("clean-recipient.png")}
    deviceGlow={C.green}
    caption={
      <>
        device shows{" "}
        <span style={{ fontFamily: MONO, color: C.text }}>{SUPPLIER}</span>
      </>
    }
    badge={<Badge color={C.green} label="APPROVED ON DEVICE" sub="signed · sender = the Ledger account" />}
  />
);

const Poisoned: React.FC = () => (
  <ScenarioLayout
    tag="Scenario 2 — poisoned invoice"
    tagColor={C.orange}
    poisoned
    deviceSrc={staticFile("poisoned-recipient.png")}
    deviceGlow={C.orange}
    caption={
      <>
        device shows{" "}
        <span style={{ fontFamily: MONO, color: C.orange }}>{ATTACKER}</span>{" "}
        — not the supplier
      </>
    }
    badge={<Badge color={C.orange} label="REJECTED ON DEVICE" sub="no signature · funds safe" />}
  />
);

const Outro: React.FC = () => (
  <Scene>
    <Center>
      <Rise delay={0}>
        <div style={{ fontFamily: SANS, fontSize: 46, color: C.dim, lineHeight: 1.4 }}>
          Software proposes. Hardware displays the truth.
          <br />
          The human approves on the device.
        </div>
      </Rise>
      <Rise delay={20} style={{ marginTop: 56 }}>
        <div style={{ fontFamily: SANS, fontSize: 84, fontWeight: 700, color: C.text }}>
          What You See Is What You Sign.
        </div>
      </Rise>
      <Rise delay={42} style={{ marginTop: 60 }}>
        <div style={{ fontFamily: MONO, fontSize: 28, color: C.dim }}>{REPO}</div>
      </Rise>
      <Rise delay={52} style={{ marginTop: 18 }}>
        <div style={{ fontFamily: MONO, fontSize: 26, color: C.orange, letterSpacing: 3 }}>
          #LedgerSponsor
        </div>
      </Rise>
    </Center>
  </Scene>
);

/* ── timeline ───────────────────────────────────────────────────────── */

export const Demo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Sequence durationInFrames={120}>
        <Intro />
      </Sequence>
      <Sequence from={120} durationInFrames={130}>
        <Explainer />
      </Sequence>
      <Sequence from={250} durationInFrames={220}>
        <Clean />
      </Sequence>
      <Sequence from={470} durationInFrames={280}>
        <Poisoned />
      </Sequence>
      <Sequence from={750} durationInFrames={150}>
        <Outro />
      </Sequence>
    </AbsoluteFill>
  );
};
