/**
 * Carsai Mozambique — Firebase Messaging Service Worker Helper
 *
 * Registers the Firebase Messaging service worker for web push notifications.
 * This module handles the service worker registration and provides functions
 * for requesting notification permission and getting FCM tokens.
 *
 * The service worker file is at /firebase-messaging-sw.js (in the public folder).
 * This helper ensures the SW is registered before attempting to get a token.
 */

import { FIREBASE_CONFIG, FIREBASE_VAPID_KEY } from '@/lib/client-config'

// ─── Service worker registration state ───

let swRegistration: ServiceWorkerRegistration | null = null
let swRegistered = false

/**
 * Register the Firebase Messaging service worker.
 * Must be called before requesting FCM tokens.
 *
 * The service worker file is served from /firebase-messaging-sw.js
 * (placed in the public/ folder).
 */
export async function registerMessagingServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined') return null
  if (!('serviceWorker' in navigator)) {
    console.warn('[FCM SW] Service Worker not supported in this browser')
    return null
  }

  if (swRegistered && swRegistration) {
    return swRegistration
  }

  try {
    // Register the service worker from the public folder
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    })

    swRegistration = registration
    swRegistered = true

    console.log('[FCM SW] Service worker registered successfully')

    // Wait for the service worker to be active
    if (registration.active) {
      return registration
    }

    // Wait for the service worker to become active
    return new Promise((resolve) => {
      const checkActive = () => {
        if (registration.active) {
          resolve(registration)
        } else if (registration.installing) {
          registration.installing.addEventListener('statechange', () => {
            if (registration.active) {
              resolve(registration)
            }
          })
        } else if (registration.waiting) {
          registration.waiting.addEventListener('statechange', () => {
            if (registration.active) {
              resolve(registration)
            }
          })
        } else {
          resolve(registration)
        }
      }
      checkActive()
    })
  } catch (err) {
    console.error('[FCM SW] Service worker registration failed:', err)
    return null
  }
}

/**
 * Check if the service worker is registered and active.
 */
export function isServiceWorkerRegistered(): boolean {
  return swRegistered && !!swRegistration
}

/**
 * Get the current service worker registration.
 */
export function getServiceWorkerRegistration(): ServiceWorkerRegistration | null {
  return swRegistration
}

/**
 * Request notification permission from the browser.
 * Returns the permission status ('granted', 'denied', 'default').
 *
 * If the service worker is not registered yet, this will register it first.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined') return 'denied'
  if (!('Notification' in window)) {
    console.warn('[FCM SW] Notifications not supported')
    return 'denied'
  }

  // Register service worker first
  await registerMessagingServiceWorker()

  // Request permission
  const permission = await Notification.requestPermission()
  return permission
}

/**
 * Get the FCM token for push notifications.
 * Requires the service worker to be registered and notification permission to be granted.
 *
 * Returns the FCM token string, or null if unsuccessful.
 */
export async function getFCMToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null

  try {
    // Ensure service worker is registered
    const registration = await registerMessagingServiceWorker()
    if (!registration) {
      console.warn('[FCM SW] Cannot get token — service worker not registered')
      return null
    }

    // Check notification permission
    if (Notification.permission !== 'granted') {
      console.warn('[FCM SW] Cannot get token — notification permission not granted')
      return null
    }

    // Check VAPID key
    if (!FIREBASE_VAPID_KEY) {
      console.warn('[FCM SW] VAPID key not configured')
      return null
    }

    // Import Firebase Messaging dynamically
    const { getMessaging, getToken } = await import('firebase/messaging')
    const { getApp } = await import('firebase/app')

    // Get or initialize the Firebase app
    let app
    try {
      app = getApp()
    } catch {
      // Firebase not initialized yet
      const { initializeApp } = await import('firebase/app')
      app = initializeApp(FIREBASE_CONFIG)
    }

    // Get messaging instance
    const messaging = getMessaging(app)

    // Get the FCM token
    const token = await getToken(messaging, {
      vapidKey: FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    })

    if (token) {
      console.log('[FCM SW] FCM token obtained successfully')
      localStorage.setItem('carsai-fcm-token', token)
    }

    return token
  } catch (error) {
    console.error('[FCM SW] Error getting FCM token:', error)
    return null
  }
}

/**
 * Unregister the service worker (useful for cleanup).
 */
export async function unregisterMessagingServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (!('serviceWorker' in navigator)) return false

  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    for (const reg of registrations) {
      if (reg.scope.includes('firebase-messaging-sw')) {
        await reg.unregister()
      }
    }
    swRegistration = null
    swRegistered = false
    localStorage.removeItem('carsai-fcm-token')
    return true
  } catch (err) {
    console.error('[FCM SW] Error unregistering service worker:', err)
    return false
  }
}
