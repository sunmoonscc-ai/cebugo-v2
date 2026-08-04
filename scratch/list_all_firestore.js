import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

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

async function inspectAllPlaces() {
  console.log('=== LISTING ALL FIRESTORE PLACES ===');
  const snap = await getDocs(collection(db, 'places'));
  snap.forEach((docSnap) => {
    const d = docSnap.data();
    console.log(`[${docSnap.id}] ${d.name} (${d.categoryName})`);
    console.log(`  Cover: ${d.images?.cover?.length || 0}, Facility: ${d.images?.facility?.length || 0}, Product: ${d.images?.product?.length || 0}, Menu: ${d.images?.menu?.length || 0}`);
    if (d.images?.cover?.[0]?.startsWith('data:')) {
      console.log(`  Cover Image is BASE64 (Length: ${d.images.cover[0].length})`);
    } else {
      console.log(`  Cover Image URL: ${d.images?.cover?.[0] || 'NONE'}`);
    }
  });
}

inspectAllPlaces().then(() => process.exit(0)).catch(console.error);
