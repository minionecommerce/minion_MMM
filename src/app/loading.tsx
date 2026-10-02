// Shown instantly while a page's server data loads, so clicking a link never looks frozen.
export default function Loading() {
  return (
    <div className="w-full min-h-[60vh] px-6 py-8" role="status" aria-label="Loading">
      <div className="h-1 w-full overflow-hidden rounded-full bg-gray-400/20 mb-8">
        <div className="h-full w-1/3 rounded-full bg-yellow-400 animate-[loading-bar_1.1s_ease-in-out_infinite]" />
      </div>
      <div className="h-7 w-56 rounded-lg bg-gray-400/20 animate-pulse mb-3" />
      <div className="h-4 w-80 max-w-full rounded bg-gray-400/15 animate-pulse mb-8" />
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-gray-400/15 animate-pulse" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-gray-400/10 animate-pulse" />
    </div>
  );
}
