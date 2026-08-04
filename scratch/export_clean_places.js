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

async function exportCleanPlaces() {
  const snap = await getDocs(collection(db, 'places'));
  const places = [];
  snap.forEach((docSnap) => {
    places.push({ id: docSnap.id, ...docSnap.data() });
  });
  fs.writeFileSync('scratch/clean_initial_places.json', JSON.stringify(places, null, 2));
  console.log(`Exported ${places.length} clean real places to scratch/clean_initial_places.json`);
}

exportCleanPlaces().then(() => process.exit(0)).catch(console.error);
