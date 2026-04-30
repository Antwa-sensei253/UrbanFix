import { Loader2 } from "lucide-react";

export function Spinner({ className = "" }: { className?: string }) {
  return <Loader2 className={`h-5 w-5 animate-spin text-muted-foreground ${className}`} />;
}

export function CenterSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
