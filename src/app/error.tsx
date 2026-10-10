"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty-state">
      <h1>A little tea break.</h1>
      <p>amiTea couldn’t load this page. Please try again in a moment.</p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
