export default function ProtectedLoading() {
  return (
    <div className="flex items-center justify-center h-full p-8" role="status" aria-label="Loading page">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
