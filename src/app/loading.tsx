export default function Loading() {
  return (
    <div className="loading-state" aria-busy="true" aria-label="Loading amiTea">
      <div className="skeleton heading" />
      {[1, 2, 3].map((i) => (
        <div className="skeleton card" key={i} />
      ))}
    </div>
  );
}
