"use client";

import Link from "next/link";
import { ArrowRight, Lightning, UsersThree } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { ArcadeMark } from "@/components/arcade-mark";
import { PointerGlow } from "@/components/pointer-glow";
import { IllustratedGameArt, TableDoodleScene } from "@/components/illustrated-game-art";

const games = [
  {
    href: "/gemwright",
    eyebrow: "Gem strategy",
    title: "Gemwright",
    description: "Collect gems, commission cards, and race to fifteen renown.",
    meta: "2–4 players",
    art: "gem",
  },
  {
    href: "/dealhouse",
    eyebrow: "Property cards",
    title: "Dealhouse",
    description: "Build three districts first. Collect rent, trade, and steal smart.",
    meta: "2 players",
    art: "deal",
  },
  {
    href: "/cave-poetry",
    eyebrow: "One-beat words",
    title: "Cave Poetry",
    description: "Give tiny clues, chase the full phrase, and Bonk your way to a big score.",
    meta: "2 players",
    art: "cave",
  },
  {
    href: "/sushi-loop",
    eyebrow: "Hidden drafting",
    title: "Sushi Loop",
    description: "Pick in secret, reveal together, and pass the hand around the table.",
    meta: "2 players",
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

      <section className="illustrated-hero">
        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="hero-kicker"><Lightning weight="fill" /> Two browsers. One tiny table.</div>
          <h1>Pick a game.<br /><span>Pass the snacks.</span></h1>
          <p>A small online board-game shelf for people who would rather be sitting across the table. Make a room, share the code, and watch every move happen live.</p>
          <div className="hero-meta" aria-label="Table for Two features">
            <span><i /> Live rooms</span>
            <span>No accounts</span>
            <span>Made for long-distance nights</span>
          </div>
          <span className="hero-hand-note" aria-hidden>good game!</span>
        </motion.div>

        <motion.div
          className="hero-illustration-card"
          initial={{ opacity: 0, scale: 0.97, rotate: 0.6 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.12, duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="hero-float-tag hero-float-tag--code">Room <strong>X7J9</strong></span>
          <TableDoodleScene />
          <span className="hero-float-tag hero-float-tag--turn"><i /> Your turn</span>
        </motion.div>
      </section>

      <section className="shelf-intro">
        <div>
          <small>Choose your table</small>
          <h2>Four games, one shelf.</h2>
        </div>
        <p>Each game keeps its own personality. The shared shell stays quiet, tactile, and a little imperfect.</p>
      </section>

      <section className="game-shelf" aria-label="Games">
        {games.map((game, index) => (
          <motion.div
            key={game.href}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 + index * 0.07, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link className="game-tile" href={game.href}>
              <div className={`game-art game-art--${game.art}`} aria-hidden>
                <IllustratedGameArt kind={game.art} />
                <span className="live-chip"><i /> Online</span>
              </div>
              <div className="game-copy">
                <div className="tile-topline">
                  <span>{game.eyebrow}</span>
                  <span className="player-meta"><UsersThree /> {game.meta}</span>
                </div>
                <h2>{game.title}</h2>
                <p>{game.description}</p>
                <span className="play-link">Open game <ArrowRight weight="bold" /></span>
              </div>
            </Link>
          </motion.div>
        ))}
      </section>

      <footer className="arcade-footer">
        <span>Play together. Make memories. Pass the snacks.</span>
        <span>Room codes · Live turns · No account needed</span>
      </footer>
    </main>
  );
}
