'use client';

import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import {
  useNotificationStore,
  type Notification,
  type NotificationType,
} from '@/lib/store';

// ──────────────────────────────────────────────
// Context Interface
// ──────────────────────────────────────────────

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (type: NotificationType, title: string, message: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

// ──────────────────────────────────────────────
// Context
// ──────────────────────────────────────────────

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

// ──────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────

export function NotificationProvider({ children }: { children: ReactNode }) {
  const store = useNotificationStore();

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications: store.notifications,
      unreadCount: store.unreadCount,
      addNotification: store.addNotification,
      markAsRead: store.markAsRead,
      markAllAsRead: store.markAllAsRead,
      removeNotification: store.removeNotification,
      clearAll: store.clearAll,
    }),
    [store]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// ──────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
