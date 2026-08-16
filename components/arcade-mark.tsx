export function ArcadeMark({ small = false }: { small?: boolean }) {
  return (
    <span className={`arcade-mark ${small ? "arcade-mark--small" : ""}`} aria-hidden>
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}
