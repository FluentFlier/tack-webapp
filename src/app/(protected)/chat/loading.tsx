export default function ChatLoading() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 space-y-4" role="status" aria-label="Loading chat">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="h-8 w-8 rounded-xl bg-primary/10" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-20 rounded bg-muted/60" />
              <div className="h-4 w-3/4 rounded bg-muted/60" />
              <div className="h-4 w-1/2 rounded bg-muted/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
