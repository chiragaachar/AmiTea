"use client";
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          background: "#131413",
          color: "#eeeae3",
          fontFamily: "Arial,sans-serif",
          padding: "12vw",
          lineHeight: 1.8,
        }}
      >
        <h1>amiTea is taking a tea break.</h1>
        <p>We couldn’t open the community. Please try again shortly.</p>
        <button
          onClick={reset}
          style={{
            padding: "12px 20px",
            background: "#e1b174",
            border: 0,
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
