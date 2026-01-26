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
