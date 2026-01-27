import admin from 'firebase-admin';

if (!admin.apps.length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } catch (error) {
      console.error('Firebase Admin Init Error: Invalid JSON in FIREBASE_SERVICE_ACCOUNT', error);
    }
  } else {
    console.error('Firebase Admin Init Error: FIREBASE_SERVICE_ACCOUNT env var missing');
  }
}

export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { token, title, body, data } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Missing token' });
  }

  try {
    const message = {
      notification: {
        title: title || 'Pesan Baru',
        body: body || 'Anda memiliki pesan baru'
      },
      data: data || {},
      token: token
    };

    const response = await admin.messaging().send(message);
    res.status(200).json({ success: true, messageId: response });
  } catch (error) {
    console.error('FCM Error:', error);
    res.status(500).json({ error: error.message });
  }
}
