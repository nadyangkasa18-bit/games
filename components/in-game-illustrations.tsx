type GameKind = "deal" | "cave" | "sushi";
type ArtMoment = "lobby" | "waiting" | "empty" | "action" | "score";

export function InGameIllustration({ kind, moment, className = "" }: { kind: GameKind; moment: ArtMoment; className?: string }) {
  return (
    <svg className={`in-game-illustration in-game-illustration--${kind} in-game-illustration--${moment} ${className}`} viewBox="0 0 240 150" aria-hidden="true">
      <path className="ig-line ig-faint" d="M18 127c37-15 71-15 102-2 32 13 66 12 103-3" />
      {kind === "deal" && <DealDrawing moment={moment} />}
      {kind === "cave" && <CaveDrawing moment={moment} />}
      {kind === "sushi" && <SushiDrawing moment={moment} />}
      <path className="ig-line ig-spark ig-spark--one" d="M32 36v15M24 43h16M27 38l10 10M37 38L27 48" />
      <path className="ig-line ig-spark ig-spark--two" d="M206 28v11M200 33h12" />
    </svg>
  );
}

export function GameDoodleLayer({ kind }: { kind: GameKind }) {
  return <div className={`game-doodle-layer game-doodle-layer--${kind}`} aria-hidden="true"><span /><span /><span /><i /><i /></div>;
}

function DealDrawing({ moment }: { moment: ArtMoment }) {
  const complete = moment === "score";
  return <>
    <path className="ig-fill ig-paper" d="M58 99V57l25-20 27 20v42z" />
    <path className="ig-line ig-ink" d="M58 99V57l25-20 27 20v42M51 59l32-25 34 26M71 99V76h22v23M67 65h9m15 0h9" />
    <path className="ig-fill ig-ochre" d="M119 104V46l32-16 30 18v56z" />
    <path className="ig-line ig-ink" d="M119 104V46l32-16 30 18v56M132 57h10m17 0h10m-37 17h10m17 0h10m-31 30V88h25v16" />
    <path className="ig-fill ig-coral" d="M174 108V70l21-15 22 15v38z" />
    <path className="ig-line ig-ink" d="M174 108V70l21-15 22 15v38m-49-36 28-20 28 20m-39 17h19" />
    {complete ? <path className="ig-line ig-reveal" d="M78 25l7 7 15-17M145 20l7 7 15-17M190 43l7 7 15-17" /> : <path className="ig-line ig-faint" d="M43 116c43-9 91-8 145 2M45 123l-13 8m55-13-10 13m72-14-8 14m64-16 12 10" />}
    {moment === "action" && <><path className="ig-fill ig-violet ig-reaction" d="M90 19h54v31H90z" /><path className="ig-line ig-ink ig-reaction" d="M90 19h54v31H90zM102 29h29m-29 9h20" /></>}
  </>;
}

function CaveDrawing({ moment }: { moment: ArtMoment }) {
  const bonk = moment === "action";
  return <>
    <path className="ig-line ig-faint" d="M37 115c10-55 39-88 84-98 42-9 75 18 88 93M58 114c9-39 30-63 64-71 31-7 56 12 69 58" />
    <g className={bonk ? "ig-reaction" : ""}>
      <path className="ig-fill ig-paper" d="M83 75c0-25 15-41 38-41s39 17 39 42v38H82z" />
      <path className="ig-line ig-ink" d="M83 75c0-25 15-41 38-41s39 17 39 42v38H82zM93 56c13-17 39-18 55-1M103 77c6-4 13-4 19 0m16-1 9 1M110 94c8 5 17 5 25-1" />
      <circle cx="112" cy="75" r="2.5" className="ig-ink-fill" /><circle cx="139" cy="75" r="2.5" className="ig-ink-fill" />
      <path className="ig-fill ig-ochre" d="M93 115l-9 21h77l-12-22z" />
    </g>
    <path className={`ig-fill ig-coral ${bonk ? "ig-club" : ""}`} d="M169 39c9-9 18-8 23 0l-8 17 20 54-15 6-17-56-17-6z" />
    <path className={`ig-line ig-ink ${bonk ? "ig-club" : ""}`} d="M169 39c9-9 18-8 23 0l-8 17 20 54-15 6-17-56-17-6z" />
    {bonk && <><path className="ig-line ig-reveal" d="M164 22l-10-12m20 11 2-16m8 20 12-10" /><text x="38" y="40" className="ig-word">BONK!</text></>}
    {moment === "waiting" && <path className="ig-line ig-faint" d="M35 83c13 5 23 4 31-4m-27 14c10 3 19 2 25-3" />}
  </>;
}

function SushiDrawing({ moment }: { moment: ArtMoment }) {
  const reveal = moment === "action" || moment === "score";
  return <>
    <path className="ig-line ig-ink" d="M27 112h188M43 126h157M36 118l12 8m27-8 12 8m27-8 12 8m27-8 12 8m27-8 12 8" />
    <ellipse className="ig-fill ig-paper" cx="78" cy="93" rx="38" ry="13" />
    <path className="ig-line ig-ink" d="M40 93c4 10 17 17 38 17 20 0 34-7 38-17" />
    <g className={reveal ? "ig-reaction" : ""}><path className="ig-fill ig-coral" d="M60 69c7-7 28-7 36 0l-4 26H64z" /><path className="ig-line ig-ink" d="M60 69c7-7 28-7 36 0l-4 26H64zM66 78h25" /><circle cx="71" cy="85" r="2" className="ig-ink-fill" /><circle cx="84" cy="85" r="2" className="ig-ink-fill" /></g>
    <ellipse className="ig-fill ig-paper" cx="161" cy="88" rx="34" ry="12" />
    <path className="ig-line ig-ink" d="M127 88c4 9 15 15 34 15s31-6 34-15" />
    <g className={reveal ? "ig-reaction" : ""}><path className="ig-fill ig-jade" d="M145 64h31l5 27h-41z" /><path className="ig-line ig-ink" d="M145 64h31l5 27h-41zM151 64c0-10 4-16 10-16s10 6 10 16" /><circle cx="154" cy="78" r="2" className="ig-ink-fill" /><circle cx="168" cy="78" r="2" className="ig-ink-fill" /></g>
    <path className="ig-line ig-faint" d="M201 44l-18 49m28-45-17 47" />
    <path className="ig-fill ig-violet" d="M204 77c6-5 15-5 20 0v29h-20z" /><path className="ig-line ig-ink" d="M204 77c6-5 15-5 20 0v29h-20zM208 84h12" />
    <path className="ig-line ig-steam" d="M62 53c-7-7 5-10-1-18m18 17c-6-7 5-10 0-18m75 17c-6-7 5-10 0-18" />
  </>;
}
