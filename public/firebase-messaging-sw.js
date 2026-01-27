// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase configuration
// MUST MATCH config in src/lib/firebase.js
const firebaseConfig = {
  apiKey: "AIzaSyBdr0BxGH9bLW3gT-hoMTCcRjcQsf4iITY",
  authDomain: "pasar-digital-a1c8f.firebaseapp.com",
  projectId: "pasar-digital-a1c8f",
  storageBucket: "pasar-digital-a1c8f.firebasestorage.app",
  messagingSenderId: "307255008826",
  appId: "1:307255008826:web:19756f0fb58d2d87be1f03"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg' // Replace with your app icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click Received.', event);
  
  event.notification.close();

  // Define the URL to open
  // We'll use the URL from the data payload if available, otherwise root
  const urlToOpen = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({type: 'window', includeUncontrolled: true}).then(function(windowClients) {
      // Check if there is already a window/tab open with the target URL
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        // If it's the same origin, just focus it and navigate
        if (client.url.indexOf(self.location.origin) === 0 && 'focus' in client) {
            // Send a message to the client to handle navigation (optional, but good for SPA)
            client.postMessage({
                msg: 'notification_clicked',
                data: event.notification.data
            });
            return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
