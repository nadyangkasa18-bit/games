import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

export const metadata = {
  title: "Gemwright",
  description: "A live multiplayer game of gems, cards, patrons, and renown.",
};

export default function GemwrightPage() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  return (
    <main className="game-frame-page">
      <header className="game-frame-bar">
        <Link href="/"><ArrowLeft weight="bold" /> All games</Link>
        <strong>Gemwright</strong>
        <span className="frame-status"><i /> Room-ready</span>
      </header>
      <iframe className="gemwright-frame" src={`${basePath}/gemwright.html`} title="Gemwright game" allow="clipboard-write" />
    </main>
  );
}
