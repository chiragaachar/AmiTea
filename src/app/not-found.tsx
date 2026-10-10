import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty-state">
      <span className="eyebrow">404 · EMPTY CUP</span>
      <h1>This tea has gone cold.</h1>
      <p>
        This amiTea page may have moved or the conversation is no longer
        available.
      </p>
      <Link href="/" className="button primary">
        Back to campus
      </Link>
    </div>
  );
}
