'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[AdminError]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
      <AlertCircle className="size-12 text-destructive" />
      <h2 className="text-xl font-semibold">Algo correu mal</h2>
      <p className="text-muted-foreground text-center max-w-md">
        Ocorreu um erro ao carregar esta página. Tente novamente ou contacte o suporte se o problema persistir.
      </p>
      {error.message && (
        <details className="text-xs text-muted-foreground bg-muted p-3 rounded-md max-w-lg w-full">
          <summary className="cursor-pointer font-medium">Detalhes do erro</summary>
          <pre className="mt-2 whitespace-pre-wrap break-all">{error.message}</pre>
        </details>
      )}
      <Button onClick={reset} className="bg-emerald-600 hover:bg-emerald-700 text-white">
        <RefreshCw className="size-4 mr-2" />
        Tentar novamente
      </Button>
    </div>
  );
}
