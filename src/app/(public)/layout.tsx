'use client';

import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { AiChatAssistant } from '@/components/features/ai-chat-assistant';
import { RealTimeNotifications } from '@/components/features/real-time-notifications';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1">
        {children}
      </main>
      <PublicFooter className="mt-auto" />
      <AiChatAssistant />
      <RealTimeNotifications />
    </div>
  );
}
