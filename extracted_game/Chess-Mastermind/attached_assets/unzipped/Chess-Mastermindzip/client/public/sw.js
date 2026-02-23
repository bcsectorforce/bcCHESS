const CACHE_NAME = 'chess-mastermind-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Daily Notification Logic
// Note: In a real production app, you would use a backend to push these via Web Push protocol.
// For a standalone PWA without a dedicated push server, we can simulate the schedule
// using the notification API if the app is open, or just provide the logic for push.
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.text() : 'Come practice chess on bcCHESS';
  event.waitUntil(
    self.registration.showNotification('bcCHESS', {
      body: data,
      icon: '/icons/icon-192x192.png'
    })
  );
});

// This is a placeholder for where you'd handle the periodic sync or alarm API
// if the browser supports it for background notifications at specific times.

