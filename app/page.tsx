"use client";

import Link from "next/link";
import { ArrowRight, CardsThree, ChatTeardropText, Diamond, ForkKnife, Lightning, UsersThree } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { ArcadeMark } from "@/components/arcade-mark";
import { PointerGlow } from "@/components/pointer-glow";

const games = [
  {
    href: "/gemwright",
    eyebrow: "Gem strategy",
    title: "Gemwright",
    description: "Collect gems, commission cards, and race to fifteen renown.",
    meta: "2–4 players",
    Icon: Diamond,
    art: "gem",
  },
  {
    href: "/dealhouse",
    eyebrow: "Property cards",
    title: "Dealhouse",
    description: "Build three districts first. Collect rent, trade, and steal smart.",
    meta: "2 players",
    Icon: CardsThree,
    art: "deal",
  },
  {
    href: "/cave-poetry",
    eyebrow: "One-beat words",
    title: "Cave Poetry",
    description: "Give tiny clues, chase the full phrase, and Bonk your way to a big score.",
    meta: "2 players",
    Icon: ChatTeardropText,
    art: "cave",
  },
  {
    href: "/sushi-loop",
    eyebrow: "Hidden drafting",
    title: "Sushi Loop",
    description: "Pick in secret, reveal together, and pass the hand around the table.",
    meta: "2 players",
    Icon: ForkKnife,
    art: "sushi",
  },
] as const;

export default function Home() {
  return (
    <main className="arcade-shell">
      <PointerGlow />
      <div className="ambient-grid" aria-hidden />
      <header className="arcade-nav">
        <Link href="/" className="wordmark" aria-label="Table for Two home">
          <ArcadeMark small />
          <span>TABLE FOR TWO</span>
        </Link>
        <span className="private-pill"><i /> Private game table</span>
      </header>

      <section className="arcade-hero">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="hero-kicker"><Lightning weight="fill" /> Two browsers. One table.</div>
          <h1>Pick a game.<br /><span>Settle it properly.</span></h1>
          <p>A tiny online board-game shelf made for Nadya and her sister. Create a room, share the code, and watch every move happen live.</p>
        </motion.div>
        <motion.div
          className="hero-signal"
          aria-label="Live multiplayer"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.18, duration: 0.5 }}
        >
          <div className="signal-orbit"><ArcadeMark /></div>
          <div className="signal-label"><span><i /> Live rooms</span><strong>Moves sync as they happen</strong></div>
        </motion.div>
      </section>

      <section className="game-shelf" aria-label="Games">
        {games.map((game, index) => (
          <motion.div
            key={game.href}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 + index * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link className="game-tile" href={game.href}>
              <div className={`game-art game-art--${game.art}`} aria-hidden>
                {game.art === "gem" ? (
                  <><span className="facet facet-a" /><span className="facet facet-b" /><span className="facet facet-c" /></>
                ) : game.art === "deal" ? (
                  <><span className="tower tower-a" /><span className="tower tower-b" /><span className="tower tower-c" /><span className="road" /></>
                ) : game.art === "cave" ? (
                  <><span className="cave-ring cave-ring-a" /><span className="cave-ring cave-ring-b" /><span className="cave-word cave-word-a">1</span><span className="cave-word cave-word-b">3</span></>
                ) : (
                  <><span className="sushi-card sushi-card-a" /><span className="sushi-card sushi-card-b" /><span className="sushi-card sushi-card-c" /><span className="sushi-belt" /></>
                )}
                <game.Icon className="art-icon" weight="duotone" />
                <span className="live-chip"><i /> Online</span>
              </div>
              <div className="game-copy">
                <div className="tile-topline"><span>{game.eyebrow}</span><span className="player-meta"><UsersThree /> {game.meta}</span></div>
                <h2>{game.title}</h2>
                <p>{game.description}</p>
                <span className="play-link">Open game <ArrowRight weight="bold" /></span>
              </div>
            </Link>
          </motion.div>
        ))}
      </section>

      <footer className="arcade-footer"><span>Built for long-distance game nights</span><span>Room codes · Live turns · No account needed</span></footer>
    </main>
  );
}
