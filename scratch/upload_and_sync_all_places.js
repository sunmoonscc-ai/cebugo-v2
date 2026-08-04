import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, updateDoc } from 'firebase/firestore';
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

async function uploadLocalFileToStorage(localFilePath, destinationFilename) {
  if (!fs.existsSync(localFilePath)) {
    console.warn(`File not found: ${localFilePath}`);
    return null;
  }
  const buffer = fs.readFileSync(localFilePath);
  const storageRef = ref(storage, `places/${destinationFilename}`);
  console.log(`Uploading ${localFilePath} to Cloud Storage (${buffer.length} bytes)...`);
  await uploadBytes(storageRef, buffer, { contentType: 'image/png' });
  const downloadUrl = await getDownloadURL(storageRef);
  console.log(`Uploaded! URL: ${downloadUrl}`);
  return downloadUrl;
}

async function uploadBase64ToStorage(base64Str, destinationFilename) {
  if (!base64Str || !base64Str.startsWith('data:')) return base64Str;
  const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) return base64Str;

  const contentType = matches[1];
  const buffer = Buffer.from(matches[2], 'base64');
  const storageRef = ref(storage, `places/${destinationFilename}`);
  console.log(`Uploading Base64 data to Cloud Storage (${buffer.length} bytes)...`);
  await uploadBytes(storageRef, buffer, { contentType });
  const downloadUrl = await getDownloadURL(storageRef);
  console.log(`Uploaded! URL: ${downloadUrl}`);
  return downloadUrl;
}

async function runSync() {
  console.log('=== UPLOADING IMAGES & SYNCING FIRESTORE PLACES ===');

  // 1. Upload 33oz Cafe Image
  const img33ozPath = path.join(brainDir, 'media__1785823774208.png');
  const url33oz = await uploadLocalFileToStorage(img33ozPath, '33oz_cafe_cover_1785823774208.png');

  // 2. Upload Cafe Will Image
  const imgWillPath = path.join(brainDir, 'media__1785821548203.png');
  const urlWill = await uploadLocalFileToStorage(imgWillPath, 'cafe_will_cover_1785821548203.png');

  // 3. Upload Ondo Bakery Image
  const imgOndoPath = path.join(brainDir, 'media__1785822088206.png');
  const urlOndo = await uploadLocalFileToStorage(imgOndoPath, 'ondo_bakery_cover_1785822088206.png');

  // 4. Update Firestore documents
  const snap = await getDocs(collection(db, 'places'));
  for (const docSnap of snap.docs) {
    const id = docSnap.id;
    const d = docSnap.data();

    // Remove dummy places if any match place_1, place_2...
    if (id.startsWith('place_')) {
      console.log(`Deleting dummy place: ${id} (${d.name})`);
      await deleteDoc(doc(db, 'places', id));
      continue;
    }

    let updatedCover = [...(d.images?.cover || [])];

    if (id === 'p_1785823722978' || d.name.includes('33온즈')) {
      if (url33oz) updatedCover = [url33oz];
    } else if (id === 'p_1785816728829' || d.name.includes('Will')) {
      if (urlWill) updatedCover = [urlWill];
      else if (updatedCover[0]?.startsWith('data:')) {
        const u = await uploadBase64ToStorage(updatedCover[0], `cafe_will_${Date.now()}.png`);
        updatedCover = [u];
      }
    } else if (id === 'p_1785818162823' || d.name.includes('온도')) {
      if (urlOndo) updatedCover = [urlOndo];
      else if (updatedCover[0]?.startsWith('data:')) {
        const u = await uploadBase64ToStorage(updatedCover[0], `ondo_bakery_${Date.now()}.png`);
        updatedCover = [u];
      }
    }

    const updatedImages = {
      cover: updatedCover,
      facility: d.images?.facility || [],
      product: d.images?.product || [],
      menu: d.images?.menu || []
    };

    console.log(`Updating Firestore place [${id}] ${d.name}...`);
    await updateDoc(doc(db, 'places', id), {
      images: updatedImages,
      updatedAt: new Date().toISOString()
    });
  }

  console.log('=== SYNC COMPLETED SUCCESSFULLY ===');
}

runSync().then(() => process.exit(0)).catch((err) => {
  console.error('Error in runSync:', err);
  process.exit(1);
});
