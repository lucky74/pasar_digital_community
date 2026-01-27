import { createClient } from '@supabase/supabase-js';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Helper untuk __dirname di ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Konfigurasi Supabase
const supabaseUrl = 'https://jcprzsukvrgjdinbsfqh.supabase.co';
const supabaseKey = 'sb_publishable_12gdgU71PsMbXxhwnohF7A_BHLK9HXt'; // Anon key
const supabase = createClient(supabaseUrl, supabaseKey);

// Konfigurasi Firebase Admin dengan Service Account
// Path ke file JSON service account (relatif terhadap script ini atau absolut)
const serviceAccountPath = 'C:/Users/user/Desktop/Pasar_Digital_Community/pasar-digital-a1c8f-firebase-adminsdk-fbsvc-e7f73a5553.json';

try {
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} catch (error) {
  console.error('Gagal memuat Service Account Key:', error.message);
  process.exit(1);
}

async function sendTestNotification() {
  console.log('Mencari token FCM user...');
  
  // Ambil token user terakhir yang punya fcm_token
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('username, fcm_token')
    .not('fcm_token', 'is', null)
    .limit(1);

  if (error) {
    console.error('Error mengambil data user:', error);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.log('Belum ada user yang memiliki fcm_token di database.');
    console.log('Pastikan user sudah login di HP dan mengizinkan notifikasi.');
    return;
  }

  const user = profiles[0];
  console.log(`Ditemukan user: ${user.username}`);
  console.log(`Token FCM: ${user.fcm_token.substring(0, 20)}...`);

  const message = {
    notification: {
      title: 'Tes Notifikasi Admin SDK',
      body: 'Halo! Ini adalah pesan tes dari script Service Account.',
    },
    token: user.fcm_token,
    data: {
      type: 'test_message',
      click_action: '/'
    }
  };

  console.log('Mengirim notifikasi ke FCM via Admin SDK...');
  
  try {
    const response = await admin.messaging().send(message);
    console.log('✅ Sukses! Notifikasi terkirim:', response);
  } catch (error) {
    console.log('❌ Gagal mengirim notifikasi:', error);
  }
}

sendTestNotification();
