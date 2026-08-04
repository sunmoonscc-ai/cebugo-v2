import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
const storage = getStorage(app);

const brainDir = 'C:\\Users\\mcbm1\\.gemini\\antigravity-ide\\brain\\6775f269-2582-4a80-8648-f41caf3d12e8';

async function fix33ozImage() {
  console.log('=== UPLOADING 33OZ CAFE JPEG TO FIREBASE STORAGE ===');
  const imgPath = path.join(brainDir, 'media__1785823774208.png');
  const buffer = fs.readFileSync(imgPath);

  const storageRef = ref(storage, `places/33oz_cafe_photo_${Date.now()}.jpg`);
  await uploadBytes(storageRef, buffer, { contentType: 'image/jpeg' });
  const downloadUrl = await getDownloadURL(storageRef);
  console.log('Uploaded 33oz photo URL:', downloadUrl);

  const placeId = 'p_1785823722978';
  console.log('Updating Firestore document p_1785823722978...');
  await updateDoc(doc(db, 'places', placeId), {
    'images.cover': [downloadUrl],
    'images.facility': [downloadUrl],
    updatedAt: new Date().toISOString()
  });

  console.log('Successfully updated 33oz Cafe in Firestore!');
}

fix33ozImage().then(() => process.exit(0)).catch(console.error);
