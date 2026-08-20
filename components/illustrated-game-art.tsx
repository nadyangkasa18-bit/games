type GameArtKind = "gem" | "deal" | "cave" | "sushi";

const line = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IllustratedGameArt({ kind }: { kind: GameArtKind }) {
  if (kind === "gem") return <GemArt />;
  if (kind === "deal") return <DealArt />;
  if (kind === "cave") return <CaveArt />;
  return <SushiArt />;
}

export function TableDoodleScene() {
  return (
    <svg className="hero-doodle-scene" viewBox="0 0 420 300" role="img" aria-label="Two illustrated players sharing a game table">
      <path className="doodle-line doodle-line--back" d="M38 237c32-9 47-7 72 2 26 9 50 9 75-1 32-13 62-11 91 1 29 12 59 13 107-1" />
      <path className="doodle-line" d="M122 209c20 10 47 14 83 13 45-1 77-7 99-18" />
      <path className="doodle-line" d="M139 177c15-10 37-15 67-15 34 0 59 6 76 18l-9 48c-42 15-83 17-126 2z" />
      <path className="doodle-fill doodle-fill--paper" d="M175 177l31-6 11 31-33 7z" />
      <path className="doodle-line" d="M179 182l23-5M183 189l20-4M186 196l15-3" />
      <path className="doodle-fill doodle-fill--coral" d="M225 178l24 3-2 25-25-2z" />
      <path className="doodle-line" d="M229 184l14 13M244 185l-14 12" />

      <g className="doodle-character doodle-character--left">
        <path className="doodle-fill doodle-fill--paper" d="M73 171c-5-34 6-66 39-73 35-7 61 17 58 54-2 24-13 44-31 56-26 17-59 0-66-37z" />
        <path className="doodle-line" d="M80 134c10-29 35-42 62-29 21 10 31 35 24 58" />
        <path className="doodle-fill doodle-fill--ink" d="M92 140c11-16 39-20 55-2 15 16 10 38-4 49-17 13-45 7-53-12-5-12-4-24 2-35z" />
        <circle cx="110" cy="157" r="5" fill="#f4ead8" />
        <circle cx="136" cy="155" r="5" fill="#f4ead8" />
        <path className="doodle-line" d="M103 205c-5 13-5 25 0 35M142 203c7 14 8 27 4 39" />
      </g>

      <g className="doodle-character doodle-character--right">
        <path className="doodle-fill doodle-fill--ochre" d="M274 169c-1-35 13-64 43-69 34-5 58 21 54 57-3 28-18 49-38 57-28 11-57-12-59-45z" />
        <path className="doodle-line" d="M286 119c19-22 50-25 70-5 15 15 19 38 10 58" />
        <path className="doodle-fill doodle-fill--ink" d="M291 142c12-16 38-18 54-2 15 15 12 35-1 47-16 14-42 10-52-7-8-13-8-27-1-38z" />
        <circle cx="309" cy="158" r="5" fill="#f4ead8" />
        <circle cx="333" cy="156" r="5" fill="#f4ead8" />
        <path className="doodle-line" d="M303 210c-2 12 0 23 6 33M342 207c6 13 7 25 4 36" />
      </g>

      <g className="doodle-spark doodle-spark--one">
        <path className="doodle-line" d="M93 63v22M82 74h22M87 68l13 13M100 68L87 81" />
      </g>
      <g className="doodle-spark doodle-spark--two">
        <path className="doodle-line" d="M319 49v16M311 57h16" />
      </g>
      <path className="doodle-line doodle-moon" d="M357 65c-13 4-21 17-17 29 4 13 17 20 29 16-10-3-16-12-16-22 0-10 5-18 14-23-3-1-6-1-10 0z" />
      <path className="doodle-line" d="M44 111c9 3 15 2 22-4M49 120c8 2 14 1 20-3" />
      <path className="doodle-line" d="M360 198c10-4 18-3 25 2M356 208c10-3 18-2 24 3" />
    </svg>
  );
}

function GemArt() {
  return (
    <svg className="illustrated-game-art" viewBox="0 0 340 230" aria-hidden="true">
      <path className="doodle-line faint-stroke" d="M33 182c43-25 86-29 126-12 45 18 92 16 149-10" />
      <path className="doodle-line faint-stroke" d="M57 62c25-17 51-17 78-1M214 42c22-11 43-9 63 6" />
      <g className="art-float art-float--slow">
        <path className="doodle-fill doodle-fill--coral" d="M173 32l54 47-21 93-52 25-47-47 14-82z" />
        <path className="doodle-line ink-stroke" d="M173 32l54 47-21 93-52 25-47-47 14-82zM173 32l-5 91-47-55M168 123l38 49M168 123l59-44M168 123l-61 27" />
        <path className="highlight-stroke" d="M177 50l31 29-13 48" />
      </g>
      <g className="art-float art-float--one">
        <path className="doodle-fill doodle-fill--blue" d="M71 64l27 20-8 37-28 13-23-24 8-32z" />
        <path className="doodle-line ink-stroke" d="M71 64l27 20-8 37-28 13-23-24 8-32zM71 64l-4 38-20-24M67 102l23 19" />
      </g>
      <g className="art-float art-float--two">
        <path className="doodle-fill doodle-fill--jade" d="M267 116l25 18-8 35-26 12-22-22 8-31z" />
        <path className="doodle-line ink-stroke" d="M267 116l25 18-8 35-26 12-22-22 8-31zM267 116l-3 36-20-24M264 152l20 17" />
      </g>
      <path className="doodle-line" d="M37 45l9 5 5 10 5-10 10-5-10-5-5-10-5 10zM287 60l5 3 3 6 3-6 6-3-6-3-3-6-3 6z" />
    </svg>
  );
}

function DealArt() {
  return (
    <svg className="illustrated-game-art" viewBox="0 0 340 230" aria-hidden="true">
      <path className="doodle-line faint-stroke" d="M30 190c61-16 107-13 142 7 41 23 86 20 139-7" />
      <g className="art-float art-float--slow">
        <path className="doodle-fill doodle-fill--paper" d="M96 67l76-18 27 111-77 17z" />
        <path className="doodle-line ink-stroke" d="M96 67l76-18 27 111-77 17zM115 86l44-10M120 103l35-8M128 133l47-11" />
        <path className="doodle-fill doodle-fill--violet" d="M129 115l21-5 8 24-21 5z" />
      </g>
      <g className="art-float art-float--one">
        <path className="doodle-fill doodle-fill--ochre" d="M194 78l53 8-13 91-54-8z" />
        <path className="doodle-line ink-stroke" d="M194 78l53 8-13 91-54-8zM203 103l32 5M199 125l31 5" />
        <path className="doodle-line ink-stroke" d="M211 161v-24l10-14 10 14v28" />
      </g>
      <path className="doodle-line" d="M73 54c11-13 27-18 43-13M255 52c11 3 20 9 27 19" />
      <path className="doodle-line" d="M61 125l10 5 5 11 5-11 11-5-11-5-5-11-5 11z" />
      <path className="doodle-line" d="M274 117c13-6 25-4 35 5M275 128c12-4 22-2 31 5" />
    </svg>
  );
}

function CaveArt() {
  return (
    <svg className="illustrated-game-art" viewBox="0 0 340 230" aria-hidden="true">
      <path className="doodle-line faint-stroke" d="M42 190c16-78 56-126 122-143 60-15 109 23 135 113" />
      <path className="doodle-line faint-stroke" d="M74 188c13-60 43-97 91-111 44-13 81 13 104 83" />
      <g className="art-float art-float--slow">
        <path className="doodle-fill doodle-fill--paper" d="M111 88l117 4-3 87-118-4z" />
        <path className="doodle-line ink-stroke" d="M111 88l117 4-3 87-118-4zM126 112l27 1M164 113l40 2M125 137l45 2M180 140l29 1" />
        <text x="129" y="128" className="svg-word">tiny</text>
        <text x="177" y="157" className="svg-word">clues</text>
      </g>
      <g className="art-float art-float--one">
        <path className="doodle-fill doodle-fill--ochre" d="M74 107c0-19 9-29 21-29s21 10 21 29v47H74z" />
        <path className="doodle-line ink-stroke" d="M74 107c0-19 9-29 21-29s21 10 21 29v47H74zM95 78c-10-10-7-22 2-32 10 12 12 23-2 32z" />
      </g>
      <path className="doodle-line" d="M254 70l8 4 4 9 4-9 9-4-9-4-4-9-4 9zM54 66l5 3 3 6 3-6 6-3-6-3-3-6-3 6z" />
    </svg>
  );
}

function SushiArt() {
  return (
    <svg className="illustrated-game-art" viewBox="0 0 340 230" aria-hidden="true">
      <path className="doodle-line faint-stroke" d="M37 162c47 27 92 33 136 17 52-19 99-14 137 14" />
      <path className="doodle-line ink-stroke" d="M56 165h229M72 183h197" />
      <g className="art-float art-float--one">
        <ellipse className="doodle-fill doodle-fill--paper" cx="111" cy="140" rx="57" ry="20" />
        <path className="doodle-line ink-stroke" d="M54 140c4 14 26 24 57 24s53-10 57-24" />
        <path className="doodle-fill doodle-fill--coral" d="M89 110c10-9 33-9 43 1l-5 34H94z" />
        <path className="doodle-line ink-stroke" d="M89 110c10-9 33-9 43 1l-5 34H94zM96 121h30" />
      </g>
      <g className="art-float art-float--two">
        <ellipse className="doodle-fill doodle-fill--paper" cx="234" cy="124" rx="46" ry="17" />
        <path className="doodle-line ink-stroke" d="M188 124c4 12 20 20 46 20 25 0 41-8 46-20" />
        <path className="doodle-fill doodle-fill--jade" d="M218 98h31l7 30h-46z" />
        <path className="doodle-line ink-stroke" d="M218 98h31l7 30h-46zM225 98c0-12 5-20 10-20s10 8 10 20" />
      </g>
      <path className="doodle-line" d="M57 69c14-8 28-9 42-2M250 62c17 0 29 5 39 15" />
      <path className="doodle-line" d="M158 69l7 4 4 8 4-8 8-4-8-4-4-8-4 8z" />
    </svg>
  );
}
