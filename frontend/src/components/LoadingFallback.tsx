import { Loader2 } from 'lucide-react';

export default function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="text-xl font-medium text-foreground">Loading Sport Buddies…</p>
      </div>
    </div>
  );
}
