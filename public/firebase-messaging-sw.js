/**
 * Carsai Mozambique — Firebase Cloud Messaging Service Worker
 *
 * This service worker handles background push notifications for web browsers.
 * It is loaded from the public/ folder and registered by firebase-messaging-sw.ts.
 *
 * Features:
 * - Handles background message display (when the app is not in focus)
 * - Handles notification click events (opens the app to the relevant page)
 * - Compatible with Firebase 12.x SDK (loaded from CDN)
 *
 * Firebase SDK imports use the CDN (importScripts) because service workers
 * run in a separate context and cannot use bundler imports.
 */

// ─── Firebase Configuration ───
// These values must match the client-side config in client-config.ts
// They are public by design (safe to include in a service worker).

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBAqWCPbR_ExDUYSH__1CvFZ7ONo2JZXKU',
  authDomain: 'carsaimz.vercel.app',
  projectId: 'carsai-mozambique-d5983',
  storageBucket: 'carsai-mozambique-d5983.firebasestorage.app',
  messagingSenderId: '136334398331',
  appId: '1:136334398331:web:4a81fc100951ed4835e3de',
  measurementId: 'G-4P1J5KZHXF',
};

// ─── Import Firebase SDK from CDN ───
// Using Firebase 12.x compatible imports

importScripts('https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging-compat.js');

// ─── Initialize Firebase in the service worker ───

firebase.initializeApp(FIREBASE_CONFIG);

// ─── Get Messaging instance ───

const messaging = firebase.messaging();

// ─── Handle background messages ───
// When the app is in the background, this callback fires and shows
// a notification to the user automatically.

messaging.onBackgroundMessage((payload) => {
  console.log('[FCM SW] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'Carsai Mozambique';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/logo.png',
    badge: '/logo.png',
    image: payload.notification?.image || undefined,
    data: {
      clickAction: payload.data?.clickAction || payload.data?.click_action || '/',
      ...payload.data,
    },
    // Allow the notification to be shown even when the app is in the foreground
    // This is the default behavior for background messages
    tag: payload.data?.tag || 'carsai-notification',
    renotify: true,
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// ─── Handle notification click ───
// When the user clicks on a notification, open the app to the relevant page.

self.addEventListener('notificationclick', (event) => {
  console.log('[FCM SW] Notification click:', event);

  event.notification.close();

  // Get the URL to open from the notification data
  const clickAction = event.notification.data?.clickAction || '/';
  const targetUrl = new URL(clickAction, self.location.origin).href;

  // Try to focus an existing window first, then open a new one
  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // Navigate the existing window to the target URL
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      // No existing window — open a new one
      return self.clients.openWindow(targetUrl);
    })
  );
});

// ─── Service Worker Lifecycle Events ───

self.addEventListener('install', (event) => {
  console.log('[FCM SW] Service worker installed');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[FCM SW] Service worker activated');
  // Claim all clients immediately
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  // This is a fallback for push events that aren't handled by
  // onBackgroundMessage (e.g., data-only messages without notification payload)
  if (!event.data) return;

  // If Firebase messaging doesn't handle it, we handle it manually
  // Firebase onBackgroundMessage already handles notification payloads,
  // so this is mainly for data-only messages
  const data = event.data.json();
  if (data.notification) {
    // Firebase messaging will handle this
    return;
  }

  // Data-only message — show custom notification
  const title = data.data?.title || 'Carsai Mozambique';
  const body = data.data?.body || 'You have a new notification';
  const clickAction = data.data?.clickAction || '/';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/logo.png',
      badge: '/logo.png',
      data: { clickAction },
      tag: 'carsai-notification',
      renotify: true,
    })
  );
});
