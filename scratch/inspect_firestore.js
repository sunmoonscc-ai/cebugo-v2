import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Read .env manually
const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach((line) => {
  const [k, v] = line.split('=');
  if (k && v) env[k.trim()] = v.trim();
});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function inspectPlaces() {
  console.log('--- Fetching Places from Firestore ---');
  const snap = await getDocs(collection(db, 'places'));
  console.log(`Total documents found in Firestore: ${snap.size}`);
  snap.forEach((docSnap) => {
    const data = docSnap.data();
    console.log(`ID: ${docSnap.id} | Name: ${data.name} | Category: ${data.categoryName || data.category}`);
    console.log('Images cover:', data.images?.cover?.length || 0);
    console.log('Images facility:', data.images?.facility?.length || 0);
    console.log('Images product:', data.images?.product?.length || 0);
    console.log('Images menu:', data.images?.menu?.length || 0);
    console.log('Full data:', JSON.stringify(data, null, 2));
    console.log('-----------------------------------');
  });
}

inspectPlaces().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
