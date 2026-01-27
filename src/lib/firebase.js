// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Firebase configuration
// Updated from user screenshot
const firebaseConfig = {
  apiKey: "AIzaSyBdr0BxGH9bLW3gT-hoMTCcRjcQsf4iITY",
  authDomain: "pasar-digital-a1c8f.firebaseapp.com",
  projectId: "pasar-digital-a1c8f",
  storageBucket: "pasar-digital-a1c8f.firebasestorage.app",
  messagingSenderId: "307255008826",
  appId: "1:307255008826:web:19756f0fb58d2d87be1f03"
};

let messaging = null;

try {
  const app = initializeApp(firebaseConfig);
  // Messaging only works in browser environments that support it
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    messaging = getMessaging(app);
  }
} catch (error) {
  console.warn("Firebase initialization failed. Check your config.", error);
}

export const requestForToken = async () => {
  if (!messaging) return null;
  
  try {
    let tokenOptions = { 
      vapidKey: 'BKUN_ZBqBt1afSsB-3SEPkB6BJkZ1qBipEYRRGC2AhsSH8Gbn6CaffqoGokkEkefAnasrEvTOKXle6C12aHv6O4' 
    };

    // Try to reuse existing SW registration (PWA) to avoid conflicts
    if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
            tokenOptions.serviceWorkerRegistration = registration;
        }
    }

    const currentToken = await getToken(messaging, tokenOptions);
    
    if (currentToken) {
      console.log('current token for client: ', currentToken);
      return currentToken;
    } else {
      console.log('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.log('An error occurred while retrieving token. ', err);
    return null;
  }
};

export const onMessageListener = (callback) => {
  if (!messaging) return;
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};
