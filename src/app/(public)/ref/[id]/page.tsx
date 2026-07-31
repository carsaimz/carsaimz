'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';

/**
 * Referral redirect page.
 * When a user visits /ref/{partnerId}, this page:
 * 1. Tracks the click in the affiliate_clicks collection
 * 2. Sets a 30-day cookie for conversion tracking
 * 3. Redirects to the home page with ?ref=partnerId
 */
export default function RefRedirectPage() {
  const params = useParams();
  const refId = params.id as string;

  useEffect(() => {
    if (!refId || refId === '__dynamic__') {
      window.location.href = '/';
      return;
    }

    // Track the click via API
    fetch('/api/affiliate/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referralCode: refId }),
    }).catch(() => {
      // Don't fail the redirect if tracking fails
    });

    // Set a 30-day cookie for conversion tracking
    document.cookie = `ref=${refId}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;

    // Redirect to home with ref parameter
    window.location.href = `/?ref=${refId}`;
  }, [refId]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-muted-foreground">A redirecionar...</p>
      </div>
    </div>
  );
}
