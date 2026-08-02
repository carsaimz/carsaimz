'use client';
import { Suspense } from 'react';
import { QuotePage } from '@/components/public/quote-page';
import { Skeleton } from '@/components/ui/skeleton';

function QuoteLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <Skeleton className="h-10 w-48 mb-4" />
        <Skeleton className="h-6 w-72 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Quote() {
  return (
    <Suspense fallback={<QuoteLoading />}>
      <QuotePage />
    </Suspense>
  );
}
